
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name, subtype) {
        super(tesla);

        var service = new Service.ContactSensor(name, subtype);

        this.addService(service);
        this.addAccessoryInformation({manufacturer:'Craft Foods', model:'HVAC', firmwareVersion:'1.0', serialNumber:'123-123'});

        this.on('refresh', (response) => {                
            service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.getState(response));
        });

        service.getCharacteristic(Characteristic.ContactSensorState).on('get', (callback) => {

            if (this.api.isOnline()) {
                Promise.resolve().then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    response = new VehicleData(response);
                    callback(null, this.getState(response));
                })
                .catch((error) => {
                    this.log(`Could not get freeze temperature for type ${subtype}.`);
                    callback(null);
                });
            }
            else
                callback(null);
        });

        
    }; 


    getState(response) {
        return response.getInsideTemperature() < 8;
    }


}

