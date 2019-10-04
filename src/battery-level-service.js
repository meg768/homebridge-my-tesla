
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class BatteryLevel extends Service.BatteryService {

    constructor(tesla, name) {
        super(name);

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.BatteryLevel).updateValue(response.getBatteryLevel());
        });


        this.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            tesla.getVehicleData((response) => {
                callback(null, response.getBatteryLevel());                
            });
    
        });
    
    }
}; 
