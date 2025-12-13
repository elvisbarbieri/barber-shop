require('dotenv').config();
const { app } = require('@azure/functions');
const {TimeSlotsHandler} = require('../handlers/TimeSlotsHandler');
const {AppointmentService} = require('../services/AppointmentService');
const {Logger} = require('../utils/Logger');
const {AppointmentMapper} = require('../mappers/AppointmentMapper');
const {AppointmentResponseMapper} = require('../mappers/AppointmentResponseMapper');

app.http('time-slots', {
    methods: ['POST'],
    route: "time-slots",
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const logger = new Logger(context);
        const appointmentMapper = new AppointmentMapper();
        const responseMapper = new AppointmentResponseMapper();
        const service = new AppointmentService(appointmentMapper, responseMapper, logger);
        const handler = new TimeSlotsHandler(service, logger);
        return await handler.execute(request, context);
    }
});

