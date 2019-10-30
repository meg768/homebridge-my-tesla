
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var service = new Service.TemperatureSensor(this.name, 'inside-temperature');
        this.addService(service);

        this.on('refresh', (response) => {                
            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.getTemperature(response));
        });

        service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            if (this.api.isOnline()) {
                Promise.resolve().then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    response = new VehicleData(response);
                    callback(null, this.getTemperature(response));
                })
                .catch((error) => {
                    this.log(`Could not current temperature for type ${subtype}.`);
                    callback(null);
                });
            }
            else
                callback(null);
        });

        
    }; 

    getTemperature(response) {
        return response.getInsideTemperature();
    }
}

