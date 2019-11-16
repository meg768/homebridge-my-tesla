
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Battery',
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.batteryLevel = undefined;

        var service = new Service.BatteryService(this.name, __filename);
        this.addService(service);

        this.vehicle.on('vehicleData', (data) => {
            this.batteryLevel = data.chargeState.getBatteryLevel();
            this.debug(`Updated battery level to ${this.batteryLevel}%.`);  

            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.currentTemperature);
        });

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
            callback(null, this.batteryLevel);
        });
        
    }; 
}

