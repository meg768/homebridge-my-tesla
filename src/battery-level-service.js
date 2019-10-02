
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class BatteryLevel extends Service.BatteryService {

    constructor(tesla, options) {
        super(options);


        this.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            tesla.refresh((response) => {
                if (response.charge_state && response.charge_state.battery_level != undefined)
                    callback(null, response.charge_state.battery_level);
                else
                    callback(null);
    
            });
    
        });
    
    }
}; 
