const {AzureUtils} = require('../utils/AzureUtils');

class BarberHandler{

    constructor(service){
        this.service= service
    }

    async execute(request,context){

        try{
            let barbers = this.service.getAvailableBarbers();
            return AzureUtils.createResponse(200, {
                success: true,
                data: barbers
            });
        }
        catch(error){
            let statusCode = 400;
            let errorResponse = {
                success: false,
                error: {
                    code: error.message === 'BARBERS_NOT_FOUND' ? 'BARBERS_NOT_FOUND' : 'INTERNAL_ERROR',
                    message: error.message === 'BARBERS_NOT_FOUND' ? 'No barbers available' : error.message
                }
            };
            
            if (error.message === 'BARBERS_NOT_FOUND') {
                statusCode = 404;
            }
            
            return AzureUtils.createResponse(statusCode, errorResponse);
        }
    }

}

module.exports = {BarberHandler}