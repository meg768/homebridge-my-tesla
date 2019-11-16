
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Outside',
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.currentTemperature = undefined;
        this.active = true;

        var service = new Service.TemperatureSensor(this.name, __filename);
        this.addService(service);

        this.vehicle.on('vehicleData', (data) => {
            this.currentTemperature = data.getOutsideTemperature();
            this.debug(`Updated outside temperature to ${this.currentTemperature}.`);  

            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
        });

        service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {
            callback(null, this.currentTemperature);
        });
        
    }; 
}

