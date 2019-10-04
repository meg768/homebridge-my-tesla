
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "charging");

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response.isCharging());
        });

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            tesla.getVehicleData((response) => {
                callback(null, response.isCharging());
            });
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var vin = tesla.config.vin;
    
            if (value) {
                Promise.resolve().then(() => {
                    return tesla.api.wakeUp(vin);
                })
                .then(() => {
                    return tesla.api.chargePortDoorOpen(vin);
                })
                .then(() => {
                    return tesla.api.chargeStart(vin);
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
                    return tesla.api.wakeUp(vin);
                })
                .then(() => {
                    return tesla.api.chargeStop(vin);    
                })
                .then(() => {
                    return tesla.api.chargePortDoorOpen(vin);
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

