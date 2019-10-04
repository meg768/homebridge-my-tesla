
var TemperatureService = require('./temperature-service.js');

module.exports = class extends TemperatureService {

    constructor(tesla, name) {
        super(tesla, name, "inner-temperature");
    }; 

    getTemperature(response) {
        response.getInsideTemperature();
    }    
}

