const services = require('../resources/services.json')

class ServicesService {   

    constructor(mongoService){
        this.mongoService =  mongoService;
    }

    validateInput(params) {
        if (!params.guests) {
            throw new Error('guests required');
        }
    }

    getAvailableServices(){
        if (!services || services.length === 0) {
            throw new Error('SERVICES_NOT_FOUND');
        }

        const allServices = [];

        services.forEach(category => {
            category.services.forEach(service => {
                allServices.push({
                    ...service,
                    category: category.categoryName
                });
            });
        });

        allServices.sort((a, b) => a.id - b.id);

        if (allServices.length === 0) {
            throw new Error('SERVICES_NOT_FOUND');
        }

        return allServices;
    }

}
module.exports = {ServicesService};

