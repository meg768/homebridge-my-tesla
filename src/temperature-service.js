
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.TemperatureSensor {

    constructor(tesla, name) {
        super(name, "inner-temperature");

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response.getInsideTemperature());
        });

        this.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            tesla.refresh((response) => {
                callback(null, getInsideTemperature(response));
            });

        });

        
    }; 
}

