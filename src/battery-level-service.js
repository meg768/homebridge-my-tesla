
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name) {
        super(tesla);

        var service = new Service.BatteryService(name);
        this.addService(service);

        this.on('refresh', (response) => {                
            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(response.getBatteryLevel());
        });

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            if (this.token) {
                this.api.getVehicleData((response) => {
                    response = new VehicleData(response);
                    callback(null, response.getBatteryLevel());                
                });
    
            }
            else
                callback(null);            
    
        });
    
    }
}; 
