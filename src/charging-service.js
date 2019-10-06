
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "charging");

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response.isCharging());
        });

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            tesla.api.getVehicleData((response) => {
                response = new VehicleData(response);
                callback(null, response.isCharging());
            });
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            if (value) {
                Promise.resolve().then(() => {
                    return tesla.api.wakeUp();
                })
                .then(() => {
                    return tesla.api.chargePortDoorOpen();
                })
                .then(() => {
                    return tesla.api.chargeStart();
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    tesla.log(error);
                })
            }
            else {
                Promise.resolve().then(() => {
                    return tesla.api.wakeUp();
                })
                .then(() => {
                    return tesla.api.chargeStop();    
                })
                .then(() => {
                    return tesla.api.chargePortDoorOpen();
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    tesla.log(error);
                })
    
            }
    
        });
    
    
    
    
    }
}; 

