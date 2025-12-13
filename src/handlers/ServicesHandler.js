const {AzureUtils} = require('../utils/AzureUtils');

class ServicesHandler{

    constructor(service){
        this.service= service
    }

    async execute(request,context){

        try{
            let services = this.service.getAvailableServices();
            return AzureUtils.createResponse(200, {
                success: true,
                data: services
            });
        }
        catch(error){
            let statusCode = 400;
            let errorResponse = {
                success: false,
                error: {
                    code: error.message === 'SERVICES_NOT_FOUND' ? 'SERVICES_NOT_FOUND' : 'INTERNAL_ERROR',
                    message: error.message === 'SERVICES_NOT_FOUND' ? 'No services available' : error.message
                }
            };
            
            if (error.message === 'SERVICES_NOT_FOUND') {
                statusCode = 404;
            }
            
            return AzureUtils.createResponse(statusCode, errorResponse);
        }
    }

}

module.exports = {ServicesHandler}

