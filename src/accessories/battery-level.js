
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var VehicleData = require('../vehicle-data.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var service = new Service.BatteryService(this.name);
        this.addService(service);

        this.on('vehicleData', (response) => {                
            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(response.getBatteryLevel());
        });

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
    
            if (this.api.isOnline()) {
                Promise.resolve().then(() => {
                    return this.api.getVehicleData();    
                })
                .then((response) => {
                    response = new VehicleData(response);
                    callback(null, response.getBatteryLevel());                
                })
                .catch((error) => {
                    this.log('Could not get battery level.');
                    callback(null);
                });
    
            }
            else
                callback(null);            
    
        });
    
    }
}; 
