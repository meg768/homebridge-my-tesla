
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name) {
        super(tesla);

        var service = new Service.Switch(name, "charging");
        this.addService(service);
        this.addAccessoryInformation({manufacturer:'Craft Foods', model:'HVAC', firmwareVersion:'1.0', serialNumber:'123-123'});

        this.on('refresh', (response) => {                
            service.getCharacteristic(Characteristic.On).updateValue(response.isCharging());
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            if (this.api.isOnline()) {
                this.log(`Getting vehicle data for charging...`);

                Promise.resolve().then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    this.log(`Got vehicle data for charging...`);
                    response = new VehicleData(response);
                    callback(null, response.isCharging());
                })
                .catch(() => {
                    callback(null);

                });
    
            }
            else
                callback(null);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            if (value) {
                Promise.resolve().then(() => {
                    return this.api.chargePortDoorOpen();
                })
                .then(() => {
                    return this.api.chargeStart();
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })
            }
            else {
                Promise.resolve().then(() => {
                    return this.api.wakeUp();
                })
                .then(() => {
                    return this.api.chargeStop();    
                })
                .then(() => {
                    return this.api.chargePortDoorOpen();
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })
    
            }
    
        });
    
    
    
    
    }
}; 

