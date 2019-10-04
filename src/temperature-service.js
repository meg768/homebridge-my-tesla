
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.TemperatureSensor {

    constructor(tesla, name) {
        super(name, "inner-temperature");

        this.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            tesla.refresh((response) => {
                if (response.climate_state && response.climate_state.inside_temp != undefined)
                    callback(null, response.climate_state.inside_temp);
                else
                    callback(null);
            });

        });

        
    }; 
}

