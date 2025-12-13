class AzureUtils {   
    static createResponse(httpStatus,response) {
        return {status: httpStatus, jsonBody: response,headers: { 'Content-Type': 'application/json' }};
    }
}


module.exports = {AzureUtils};