const { app } = require('@azure/functions');
const {BarberHandler} = require('../handlers/BarberHandler');
const {BarberService} = require('../services/BarberService');

app.http('barbers', {
    methods: ['GET'],
    route: "barbers",
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const service = new BarberService();
        const handler = new BarberHandler(service);
        return await handler.execute(request, context);
    }
});
