
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.TemperatureSensor {

    constructor(tesla, name) {
        super(name, "inner-temperature");

        var getInsideTemperature = (response) => {
            if (response && response.climate_state && response.climate_state.inside_temp)
                return response.climate_state.inside_temp;
                
            return 20;
        };

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(getInsideTemperature(response));
        });

        this.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            tesla.refresh((response) => {
                callback(null, getInsideTemperature(response));
            });

        });

        
    }; 
}

