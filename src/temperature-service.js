
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name, subtype) {
        super(tesla);

        var service = new Service.TemperatureSensor(name, subtype);
        this.addService(service);

        this.on('refresh', (response) => {                
            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.getTemperature(response));
        });

        service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            if (this.api.token) {
                this.api.getVehicleData().then((response) => {
                    response = new VehicleData(response);
                    callback(null, this.getTemperature(response));
                });
    
            }
            else
                callback(null);
        });

        
    }; 

    getTemperature(response) {
        return -20;
    }
}

