const barbers = require('../resources/barbers.json')

class BarberService {   

    constructor(mongoService){
        this.mongoService =  mongoService;
    }

    validateInput(params) {
        if (!params.guests) {
            throw new Error('guests required');
        }
    }

    getAvailableBarbers(){
        if (!barbers || barbers.length === 0) {
            throw new Error('BARBERS_NOT_FOUND');
        }
        return barbers;
    }

}
module.exports = {BarberService};