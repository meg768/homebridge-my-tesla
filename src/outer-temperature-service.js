
var TemperatureService = require('./temperature-service.js');

module.exports = class extends TemperatureService {

    constructor(tesla, name) {
        super(tesla, name, "outside-temperature");
    }; 

    getTemperature(response) {
        response.getOutsideTemperature();
    }    
}

