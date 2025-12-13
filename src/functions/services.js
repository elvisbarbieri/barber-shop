const { app } = require('@azure/functions');
const {ServicesHandler} = require('../handlers/ServicesHandler');
const {ServicesService} = require('../services/ServicesService');

app.http('services', {
    methods: ['GET'],
    route: "services",
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const service = new ServicesService();
        const handler = new ServicesHandler(service);
        return await handler.execute(request, context);
    }
});

