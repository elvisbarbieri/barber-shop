const {AzureUtils} = require('../utils/AzureUtils');
const {Logger} = require('../utils/Logger');

class AppointmentConfirmationHandler {

    constructor(service, emailService, logger) {
        this.service = service;
        this.emailService = emailService;
        this.logger = logger;
    }

    async execute(request, context) {
        try {
            const body = await request.json();
            
            
            this.logger.logInput('sendConfirmationEmail', body);
            
            
            if (!body.appointmentId) {
                return AzureUtils.createResponse(400, {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: [
                            {
                                field: 'appointmentId',
                                message: 'Appointment ID is required'
                            }
                        ]
                    }
                });
            }

            const result = await this.service.sendConfirmationEmail(
                body.appointmentId,
                this.emailService,
                this.logger
            );
            
            
            this.logger.info('Confirmation email sent successfully', {
                appointmentId: body.appointmentId,
                messageId: result.messageId
            });
            
            return AzureUtils.createResponse(200, {
                success: true,
                data: result,
                message: "Confirmation email sent successfully"
            });
        }
        catch(error) {
            
            this.logger.error('Error sending confirmation email', error, {
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
            
            else if (error.message === 'APPOINTMENT_NOT_FOUND') {
                statusCode = 404;
                errorResponse.error = {
                    code: 'APPOINTMENT_NOT_FOUND',
                    message: 'Appointment not found'
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
            
            else if (error.message === 'EMAIL_SEND_FAILED') {
                statusCode = 500;
                errorResponse.error = {
                    code: 'EMAIL_SEND_FAILED',
                    message: 'Failed to send confirmation email'
                };
            }
            
            return AzureUtils.createResponse(statusCode, errorResponse);
        }
    }

    getErrorMessage(error) {
        if (error.message === 'VALIDATION_ERROR') {
            return 'Invalid input data';
        }
        if (error.message === 'APPOINTMENT_NOT_FOUND') {
            return 'Appointment not found';
        }
        if (error.message === 'BARBER_NOT_FOUND') {
            return 'Barber not found';
        }
        if (error.message === 'SERVICE_NOT_FOUND') {
            return 'Service not found';
        }
        if (error.message === 'EMAIL_SEND_FAILED') {
            return 'Failed to send confirmation email';
        }
        return error.message || 'An error occurred';
    }

}

module.exports = {AppointmentConfirmationHandler};

