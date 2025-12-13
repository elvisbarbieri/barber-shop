const {AzureUtils} = require('../utils/AzureUtils');
const {Logger} = require('../utils/Logger');

class AppointmentHandler{

    constructor(service, logger){
        this.service= service;
        this.logger = logger;
    }

    async execute(request,context){

        try{
            const body = await request.json();
            
            
            this.logger.logInput('createAppointment', body);
            
            const appointment = await this.service.createAppointment(body, this.logger);
            
            
            this.logger.info('Appointment created successfully', {
                appointmentId: appointment.id,
                barberId: appointment.barber.id,
                serviceId: appointment.service.id,
                date: appointment.date,
                time: appointment.time
            });
            
            return AzureUtils.createResponse(201, {
                success: true,
                data: appointment,
                message: "Appointment created successfully"
            });
        }
        catch(error){
            
            this.logger.error('Error creating appointment', error, {
                errorCode: error.message
            });
            let statusCode = 400;
            let errorResponse = {
                success: false,
                error: {
                    code: error.message || 'INTERNAL_ERROR',
                    message: this.getErrorMessage(error)
                }
            };

            
            if (error.message === 'VALIDATION_ERROR') {
                statusCode = 400;
                errorResponse.error = {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.details || []
                };
            }
            
            else if (error.message === 'TIME_SLOT_UNAVAILABLE') {
                statusCode = 409;
                errorResponse.error = {
                    code: 'TIME_SLOT_UNAVAILABLE',
                    message: 'The selected time slot is not available'
                };
            }
            
            else if (error.message === 'BARBER_UNAVAILABLE') {
                statusCode = 409;
                errorResponse.error = {
                    code: 'BARBER_UNAVAILABLE',
                    message: 'Barber is not available at the selected time'
                };
            }
            
            return AzureUtils.createResponse(statusCode, errorResponse);
        }
    }

    getErrorMessage(error) {
        if (error.message === 'VALIDATION_ERROR') {
            return 'Invalid input data';
        }
        if (error.message === 'TIME_SLOT_UNAVAILABLE') {
            return 'The selected time slot is not available';
        }
        if (error.message === 'BARBER_UNAVAILABLE') {
            return 'Barber is not available at the selected time';
        }
        return error.message || 'An error occurred';
    }

}

module.exports = {AppointmentHandler}

