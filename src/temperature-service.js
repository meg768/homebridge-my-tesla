
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.TemperatureSensor {

    constructor(tesla, name, subtype) {
        super(name, subtype);

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(this.getTemperature(response));
        });

        this.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            tesla.getVehicleData((response) => {
                callback(null, this.getTemperature(response));
            });

        });

        
    }; 

    getTemperature(response) {
        return -20;
    }
}

