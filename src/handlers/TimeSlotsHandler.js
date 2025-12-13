const {AzureUtils} = require('../utils/AzureUtils');
const {Logger} = require('../utils/Logger');

class TimeSlotsHandler{

    constructor(service, logger){
        this.service= service;
        this.logger = logger;
    }

    async execute(request,context){

        try{
            const body = await request.json();
            
            
            this.logger.logInput('getAvailableTimeSlots', body);
            
            
            this.service.validateTimeSlotsRequest(body);
            
            
            const availableSlots = await this.service.getAvailableTimeSlots(
                body.barberId,
                body.serviceId || null, 
                body.date,
                undefined, 
                undefined, 
                undefined, 
                this.logger
            );
            
            
            this.logger.info('Time slots retrieved successfully', {
                barberId: body.barberId,
                serviceId: body.serviceId,
                date: body.date,
                slotsCount: availableSlots.length
            });
            
            return AzureUtils.createResponse(200, {
                success: true,
                data: {
                    date: body.date,
                    availableSlots: availableSlots
                }
            });
        }
        catch(error){
            
            this.logger.error('Error getting time slots', error, {
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
            
            else if (error.message === 'INVALID_DATE') {
                statusCode = 400;
                errorResponse.error = {
                    code: 'INVALID_DATE',
                    message: 'Date must be in the future'
                };
            }
            
            else if (error.message === 'BARBER_NOT_FOUND') {
                statusCode = 404;
                errorResponse.error = {
                    code: 'BARBER_NOT_FOUND',
                    message: 'Barber not found'
                };
            }
            
            else if (error.message === 'SERVICE_NOT_FOUND') {
                statusCode = 404;
                errorResponse.error = {
                    code: 'SERVICE_NOT_FOUND',
                    message: 'Service not found'
                };
            }
            
            return AzureUtils.createResponse(statusCode, errorResponse);
        }
    }

    getErrorMessage(error) {
        if (error.message === 'VALIDATION_ERROR') {
            return 'Invalid input data';
        }
        if (error.message === 'INVALID_DATE') {
            return 'Date must be in the future';
        }
        if (error.message === 'BARBER_NOT_FOUND') {
            return 'Barber not found';
        }
        if (error.message === 'SERVICE_NOT_FOUND') {
            return 'Service not found';
        }
        return error.message || 'An error occurred';
    }

}

module.exports = {TimeSlotsHandler}

