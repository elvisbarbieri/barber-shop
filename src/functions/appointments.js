const { app } = require('@azure/functions');
const {AppointmentHandler} = require('../handlers/AppointmentHandler');
const {AppointmentService} = require('../services/AppointmentService');
const {Logger} = require('../utils/Logger');
const {AppointmentMapper} = require('../mappers/AppointmentMapper');
const {AppointmentResponseMapper} = require('../mappers/AppointmentResponseMapper');

app.http('appointments', {
    methods: ['POST'],
    route: "appointments",
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const logger = new Logger(context);
        const appointmentMapper = new AppointmentMapper();
        const responseMapper = new AppointmentResponseMapper();
        const service = new AppointmentService(appointmentMapper, responseMapper, logger);
        const handler = new AppointmentHandler(service, logger);
        return await handler.execute(request, context);
    }
});

