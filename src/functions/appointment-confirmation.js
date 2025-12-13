const { app } = require('@azure/functions');
const {AppointmentConfirmationHandler} = require('../handlers/AppointmentConfirmationHandler');
const {AppointmentService} = require('../services/AppointmentService');
const {Logger} = require('../utils/Logger');
const {EmailService} = require('../utils/EmailService');
const {AppointmentMapper} = require('../mappers/AppointmentMapper');
const {AppointmentResponseMapper} = require('../mappers/AppointmentResponseMapper');

app.http('appointment-confirmation', {
    methods: ['POST'],
    route: "appointment/confirmation",
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const logger = new Logger(context);
        const emailService = new EmailService(logger);
        const appointmentMapper = new AppointmentMapper();
        const responseMapper = new AppointmentResponseMapper();
        const service = new AppointmentService(appointmentMapper, responseMapper, logger);
        const handler = new AppointmentConfirmationHandler(service, emailService, logger);
        return await handler.execute(request, context);
    }
});

