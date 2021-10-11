
var TemperatureSensor = require('./core/temperature.js');

module.exports = class extends TemperatureSensor {

    constructor(options) {

        var config = {
            name: 'Outside'
        };

        super({...options, config:Object.assign({}, config, options.config)});

        
    }

    getTemperature(vehicleData) {
        return vehicleData.climate_state.outside_temp;
    }
}