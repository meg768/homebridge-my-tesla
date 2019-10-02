
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Switch {

    constructor(tesla, options) {
        super(options);


        this.getCharacteristic(Characteristic.On).on('get', (callback) => {

            tesla.refresh((response) => {
                var charging = false;
    
                if (response.charge_state) {
                    switch (response.charge_state.charging_state) {
                        case 'Disconnected': {
                            charging = false;
                            break;
                        }
                        case 'Stopped': {
                            charging = false;
                            break;
                        }
                        default: {
                            charging = true;
                            break;
                        }
                    }
                }
    
                callback(null, charging);
            });
    
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
    
            var vin = tesla.config.vin;
    
            if (value) {
                Promise.resolve().then(() => {
                    return tesla.api.setChargePortDoorState(vin, true);
                })
                .then(() => {
                    return tesla.api.setChargeState(vin, true);
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
                    return tesla.api.setChargeState(vin, false);    
                })
                .then(() => {
                    return tesla.api.setChargePortDoorState(vin, false);
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

