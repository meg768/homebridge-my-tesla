
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class BatteryLevel extends Service.BatteryService {

    constructor(tesla, name) {
        super(name);


        this.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            tesla.refresh((response) => {
                callback(null, response.getBatteryLevel());                
            });
    
        });
    
    }
}; 
