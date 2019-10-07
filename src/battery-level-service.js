
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');

module.exports = class BatteryLevel extends Service.BatteryService {

    constructor(tesla, name) {
        super(name);

        this.on('refresh', (response) => {                
            this.getCharacteristic(Characteristic.BatteryLevel).updateValue(response.getBatteryLevel());
        });


        this.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            if (tesla.token) {
                tesla.api.getVehicleData((response) => {
                    response = new VehicleData(response);
                    callback(null, response.getBatteryLevel());                
                });
    
            }
            else
                callback(null);            
    
        });
    
    }
}; 
