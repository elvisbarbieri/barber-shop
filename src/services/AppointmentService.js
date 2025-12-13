const barbers = require('../resources/barbers.json');
const services = require('../resources/services.json');
const { CosmosService } = require('./CosmosService');
const { ObjectId } = require('mongodb');

class AppointmentService {
    constructor(appointmentMapper, responseMapper, logger = null) {
        this.cosmosService = new CosmosService('distrito-barbearia', 'appointments');
        this.appointmentMapper = appointmentMapper;
        this.responseMapper = responseMapper;
        this.logger = logger;
    }

    validateInput(data) {
        const errors = [];

        
        if (data.barberId === undefined || data.barberId === null) {
            errors.push({ field: 'barberId', message: 'Barber ID is required' });
        } else if (typeof data.barberId !== 'number') {
            errors.push({ field: 'barberId', message: 'Barber ID must be a number' });
        } else {
            const barber = barbers.find(b => b.id === data.barberId);
            if (!barber) {
                errors.push({ field: 'barberId', message: 'Invalid barber ID' });
            }
        }

        
        if (data.serviceId === undefined || data.serviceId === null) {
            errors.push({ field: 'serviceId', message: 'Service ID is required' });
        } else if (typeof data.serviceId !== 'number') {
            errors.push({ field: 'serviceId', message: 'Service ID must be a number' });
        } else {
            let serviceFound = false;
            for (const category of services) {
                if (category.services.some(s => s.id === data.serviceId)) {
                    serviceFound = true;
                    break;
                }
            }
            if (!serviceFound) {
                errors.push({ field: 'serviceId', message: 'Invalid service ID' });
            }
        }

        
        if (!data.date) {
            errors.push({ field: 'date', message: 'Date is required' });
        } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(data.date)) {
                errors.push({ field: 'date', message: 'Date must be in format YYYY-MM-DD' });
            } else {
                const appointmentDate = new Date(data.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (appointmentDate <= today) {
                    errors.push({ field: 'date', message: 'Date must be in the future' });
                }
            }
        }

        
        if (!data.time) {
            errors.push({ field: 'time', message: 'Time is required' });
        } else {
            const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
            if (!timeRegex.test(data.time)) {
                errors.push({ field: 'time', message: 'Time must be in format HH:MM AM/PM' });
            }
        }

        
        if (!data.customerName) {
            errors.push({ field: 'customerName', message: 'Customer name is required' });
        } else if (typeof data.customerName !== 'string') {
            errors.push({ field: 'customerName', message: 'Customer name must be a string' });
        } else if (data.customerName.length < 3 || data.customerName.length > 100) {
            errors.push({ field: 'customerName', message: 'Customer name must be between 3 and 100 characters' });
        }

        
        if (!data.customerEmail) {
            errors.push({ field: 'customerEmail', message: 'Customer email is required' });
        } else if (typeof data.customerEmail !== 'string') {
            errors.push({ field: 'customerEmail', message: 'Customer email must be a string' });
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.customerEmail)) {
                errors.push({ field: 'customerEmail', message: 'Invalid email format' });
            }
        }

        
        if (!data.customerWhatsapp) {
            errors.push({ field: 'customerWhatsapp', message: 'Customer WhatsApp is required' });
        } else if (typeof data.customerWhatsapp !== 'string') {
            errors.push({ field: 'customerWhatsapp', message: 'Customer WhatsApp must be a string' });
        }

        
        if (!data.paymentMethod) {
            errors.push({ field: 'paymentMethod', message: 'Payment method is required' });
        } else if (data.paymentMethod !== 'later' && data.paymentMethod !== 'now') {
            errors.push({ field: 'paymentMethod', message: 'Payment method must be either "later" or "now"' });
        }

        if (errors.length > 0) {
            const error = new Error('VALIDATION_ERROR');
            error.details = errors;
            throw error;
        }
    }

    
    timeToMinutes(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
            totalMinutes -= 12 * 60;
        }
        
        return totalMinutes;
    }

    
    getServiceDuration(serviceId) {
        for (const category of services) {
            const service = category.services.find(s => s.id === serviceId);
            if (service) {
                return service.duration;
            }
        }
        
        return 45;
    }

    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        let hour12 = hours;
        let period = 'AM';
        
        if (hours === 0) {
            hour12 = 12;
            period = 'AM';
        } else if (hours === 12) {
            hour12 = 12;
            period = 'PM';
        } else if (hours > 12) {
            hour12 = hours - 12;
            period = 'PM';
        } else {
            period = 'AM';
        }
        
        
        return `${String(hour12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
    }

    
    appointmentsOverlap(start1, duration1, start2, duration2) {
        const end1 = start1 + duration1;
        const end2 = start2 + duration2;
        
        return start1 < end2 && start2 < end1;
    }

    async checkTimeSlotAvailability(barberId, date, time, serviceId, bufferMinutes = 15, logger = null) {
        
        const log = logger || this.logger;
        
        if (log) {
            log.logBeforeDbOperation('checkTimeSlotAvailability', {
                barberId,
                date,
                time,
                serviceId,
                bufferMinutes
            });
        }
        
        try {
            await this.cosmosService.connect();
            
            
            const existingAppointments = await this.cosmosService.collection.find({
                barberId: barberId,
                date: date,
                status: { $ne: 'cancelled' }
            }).toArray();

            
            const newAppointmentDuration = this.getServiceDuration(serviceId);
            const newAppointmentStart = this.timeToMinutes(time);
            
            const newAppointmentEnd = newAppointmentStart + newAppointmentDuration + bufferMinutes;

            
            
            for (const existingAppointment of existingAppointments) {
                const existingDuration = this.getServiceDuration(existingAppointment.serviceId);
                const existingStart = this.timeToMinutes(existingAppointment.time);
                
                const existingEnd = existingStart + existingDuration + bufferMinutes;

                
                
                
                if (newAppointmentStart < existingEnd && existingStart < newAppointmentEnd) {
                    if (log) {
                        log.warn('Time slot unavailable - overlapping appointment', {
                            barberId,
                            date,
                            time,
                            newAppointmentStart,
                            newAppointmentEnd,
                            existingStart,
                            existingEnd,
                            bufferMinutes,
                            gap: Math.min(
                                newAppointmentStart - existingEnd,
                                existingStart - newAppointmentEnd
                            ),
                            existingAppointmentId: existingAppointment._id
                        });
                    }
                    throw new Error('TIME_SLOT_UNAVAILABLE');
                }
            }

            if (log) {
                log.logAfterDbOperation('checkTimeSlotAvailability', {
                    found: existingAppointments.length,
                    available: true,
                    newAppointmentStart,
                    newAppointmentEnd
                });
            }
        } catch (error) {
            if (error.message === 'TIME_SLOT_UNAVAILABLE') {
                if (log) {
                    log.warn('Time slot unavailable', {
                        barberId,
                        date,
                        time
                    });
                }
                throw error;
            }
            
            
            if (log) {
                log.warn('Error checking time slot availability, assuming available', {
                    error: error.message
                });
            }
        }
    }


    async createAppointment(data, logger = null) {
        const log = logger || this.logger;
        
        
        if (log) {
            log.logBeforeJsonRead('barbers.json');
        }
        
        
        this.validateInput(data);

        
        if (log) {
            log.logAfterJsonRead('barbers.json', barbers);
        }

        
        
        if (log) {
            log.logBeforeJsonRead('services.json');
        }

        let service = null;
        for (const category of services) {
            service = category.services.find(s => s.id === data.serviceId);
            if (service) break;
        }

        
        if (log) {
            log.logAfterJsonRead('services.json', services);
        }

        if (!service) {
            const error = new Error('SERVICE_NOT_FOUND');
            if (log) {
                log.error('Service not found', error, { serviceId: data.serviceId });
            }
            throw error;
        }

        
        await this.checkTimeSlotAvailability(data.barberId, data.date, data.time, data.serviceId, undefined, log);

        
        const barber = barbers.find(b => b.id === data.barberId);
        if (!barber) {
            const error = new Error('BARBER_UNAVAILABLE');
            if (log) {
                log.error('Barber not found', error, { barberId: data.barberId });
            }
            throw error;
        }

        
        const appointment = this.appointmentMapper.map(data);

        
        if (log) {
            log.logBeforeDbOperation('insertAppointment', {
                barberId: appointment.barberId,
                serviceId: appointment.serviceId,
                date: appointment.date,
                time: appointment.time,
                customerName: appointment.customerName,
                customerEmail: appointment.customerEmail,
                paymentMethod: appointment.paymentMethod,
                status: appointment.status,
                confirmationCode: appointment.confirmationCode
            });
        }

        
        try {
            await this.cosmosService.connect();
            const result = await this.cosmosService.collection.insertOne(appointment);
            
            
            if (log) {
                log.logAfterDbOperation('insertAppointment', {
                    insertedId: result.insertedId.toString(),
                    acknowledged: result.acknowledged
                });
            }
            
            
            const response = this.responseMapper.map(appointment, barber, service, result);

            return response;
        } catch (error) {
            if (log) {
                log.error('Error saving appointment to database', error, {
                    barberId: appointment.barberId,
                    serviceId: appointment.serviceId,
                    date: appointment.date,
                    time: appointment.time
                });
            }
            throw new Error(`Error creating appointment: ${error.message}`);
        } finally {
            await this.cosmosService.close();
        }
    }

    
    validateTimeSlotsRequest(data) {
        const errors = [];

        
        if (!data.date) {
            errors.push({ field: 'date', message: 'Date is required' });
        } else {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(data.date)) {
                errors.push({ field: 'date', message: 'Date must be in format YYYY-MM-DD' });
            } else {
                const appointmentDate = new Date(data.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (appointmentDate <= today) {
                    errors.push({ field: 'date', message: 'Date must be in the future' });
                }
            }
        }

        
        if (data.barberId === undefined || data.barberId === null) {
            errors.push({ field: 'barberId', message: 'Barber ID is required' });
        } else if (typeof data.barberId !== 'number') {
            errors.push({ field: 'barberId', message: 'Barber ID must be a number' });
        }

        
        if (data.serviceId !== undefined && data.serviceId !== null && typeof data.serviceId !== 'number') {
            errors.push({ field: 'serviceId', message: 'Service ID must be a number' });
        }

        if (errors.length > 0) {
            const error = new Error('VALIDATION_ERROR');
            error.details = errors;
            throw error;
        }
    }

    
    async getAvailableTimeSlots(barberId, serviceId = null, date, businessStart = 540, businessEnd = 1080, bufferMinutes = 15, logger = null) {
        const log = logger || this.logger;

        
        const barber = barbers.find(b => b.id === barberId);
        if (!barber) {
            const error = new Error('BARBER_NOT_FOUND');
            if (log) {
                log.error('Barber not found', error, { barberId });
            }
            throw error;
        }

        
        let service = null;
        let serviceDuration = 30; 
        let slotInterval = 30; 

        if (serviceId !== null && serviceId !== undefined) {
            for (const category of services) {
                service = category.services.find(s => s.id === serviceId);
                if (service) break;
            }

            if (!service) {
                const error = new Error('SERVICE_NOT_FOUND');
                if (log) {
                    log.error('Service not found', error, { serviceId });
                }
                throw error;
            }

            
            
            serviceDuration = service.duration;
            slotInterval = serviceDuration + bufferMinutes; 
        } else {
            
            
            slotInterval = 30 + bufferMinutes; 
        }

        
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDate <= today) {
            const error = new Error('INVALID_DATE');
            if (log) {
                log.error('Date must be in the future', error, { date });
            }
            throw error;
        }

        if (log) {
            log.logBeforeDbOperation('getAvailableTimeSlots', {
                barberId,
                serviceId,
                serviceDuration,
                slotInterval,
                bufferMinutes,
                date,
                businessStart,
                businessEnd
            });
        }

        try {
            await this.cosmosService.connect();
            
            
            const existingAppointments = await this.cosmosService.collection.find({
                barberId: barberId,
                date: date,
                status: { $ne: 'cancelled' }
            }).toArray();

            
            
            const bookedRanges = existingAppointments.map(apt => {
                const start = this.timeToMinutes(apt.time);
                const duration = this.getServiceDuration(apt.serviceId);
                return {
                    start: start,
                    end: start + duration + bufferMinutes 
                };
            });

            
            
            const lastPossibleSlot = businessEnd - serviceDuration;
            const allSlots = [];
            
            
            for (let minutes = businessStart; minutes <= lastPossibleSlot; minutes += slotInterval) {
                allSlots.push(minutes);
            }
            
            
            if (lastPossibleSlot > businessStart && 
                lastPossibleSlot % slotInterval !== 0 && 
                !allSlots.includes(lastPossibleSlot)) {
                const previousSlot = allSlots[allSlots.length - 1];
                if (lastPossibleSlot > previousSlot) {
                    allSlots.push(lastPossibleSlot);
                }
            }

            
            
            
            const availableSlots = allSlots.filter(slotStart => {
                
                if (slotStart + serviceDuration > businessEnd) {
                    return false; 
                }
                
                
                const newSlotBlockedStart = slotStart;
                const newSlotBlockedEnd = slotStart + serviceDuration + bufferMinutes;
                
                
                for (const bookedRange of bookedRanges) {
                    
                    if (newSlotBlockedStart < bookedRange.end && bookedRange.start < newSlotBlockedEnd) {
                        return false; 
                    }
                }
                
                return true; 
            });

            
            const availableTimeSlots = availableSlots.map(minutes => this.minutesToTime(minutes));

            if (log) {
                log.logAfterDbOperation('getAvailableTimeSlots', {
                    barberId,
                    serviceId,
                    serviceDuration,
                    slotInterval,
                    bufferMinutes,
                    date,
                    totalSlots: allSlots.length,
                    bookedAppointments: bookedRanges.length,
                    availableSlots: availableTimeSlots.length
                });
            }

            return availableTimeSlots;
        } catch (error) {
            
            if (error.message === 'BARBER_NOT_FOUND' || 
                error.message === 'SERVICE_NOT_FOUND' || 
                error.message === 'INVALID_DATE' ||
                error.message === 'VALIDATION_ERROR') {
                throw error;
            }
            
            if (log) {
                log.error('Error getting available time slots', error, {
                    barberId,
                    date
                });
            }
            throw new Error(`Error getting available time slots: ${error.message}`);
        } finally {
            await this.cosmosService.close();
        }
    }

    
    async sendConfirmationEmail(appointmentId, emailService, logger = null) {
        const log = logger || this.logger;
        
        if (!appointmentId) {
            const error = new Error('VALIDATION_ERROR');
            error.details = [{ field: 'appointmentId', message: 'Appointment ID is required' }];
            throw error;
        }

        
        if (log) {
            log.logBeforeDbOperation('getAppointmentById', { appointmentId });
        }

        try {
            await this.cosmosService.connect();
            
            
            const appointment = await this.cosmosService.collection.findOne({
                _id: new ObjectId(appointmentId)
            });

            
            if (log) {
                log.logAfterDbOperation('getAppointmentById', {
                    found: !!appointment,
                    appointmentId
                });
            }

            if (!appointment) {
                const error = new Error('APPOINTMENT_NOT_FOUND');
                if (log) {
                    log.error('Appointment not found', error, { appointmentId });
                }
                throw error;
            }

            
            if (log) {
                log.logBeforeJsonRead('barbers.json');
            }
            const barber = barbers.find(b => b.id === appointment.barberId);
            
            if (log) {
                log.logAfterJsonRead('barbers.json', barbers);
            }

            if (!barber) {
                const error = new Error('BARBER_NOT_FOUND');
                if (log) {
                    log.error('Barber not found', error, { barberId: appointment.barberId });
                }
                throw error;
            }

            if (log) {
                log.logBeforeJsonRead('services.json');
            }
            let service = null;
            for (const category of services) {
                service = category.services.find(s => s.id === appointment.serviceId);
                if (service) break;
            }
            
            if (log) {
                log.logAfterJsonRead('services.json', services);
            }

            if (!service) {
                const error = new Error('SERVICE_NOT_FOUND');
                if (log) {
                    log.error('Service not found', error, { serviceId: appointment.serviceId });
                }
                throw error;
            }

            
            const appointmentData = {
                customerEmail: appointment.customerEmail,
                customerName: appointment.customerName,
                barber: {
                    name: barber.name,
                    specialty: barber.specialty
                },
                service: {
                    name: service.name,
                    price: service.price,
                    duration: service.duration
                },
                date: appointment.date,
                time: appointment.time,
                confirmationCode: appointment.confirmationCode,
                customerWhatsapp: appointment.customerWhatsapp,
                paymentMethod: appointment.paymentMethod
            };

            
            const emailResult = await emailService.sendConfirmationEmail(appointmentData);

            if (log) {
                log.info('Confirmation email sent successfully', {
                    appointmentId,
                    customerEmail: appointment.customerEmail,
                    messageId: emailResult.messageId
                });
            }

            return {
                success: true,
                appointmentId,
                emailSent: true,
                sentAt: emailResult.sentAt,
                messageId: emailResult.messageId
            };
        } catch (error) {
            if (error.message === 'APPOINTMENT_NOT_FOUND' ||
                error.message === 'BARBER_NOT_FOUND' ||
                error.message === 'SERVICE_NOT_FOUND' ||
                error.message === 'VALIDATION_ERROR' ||
                error.message === 'EMAIL_SEND_FAILED') {
                throw error;
            }
            
            if (log) {
                log.error('Error sending confirmation email', error, {
                    appointmentId
                });
            }
            throw new Error(`Error sending confirmation email: ${error.message}`);
        } finally {
            await this.cosmosService.close();
        }
    }

}

module.exports = { AppointmentService };

