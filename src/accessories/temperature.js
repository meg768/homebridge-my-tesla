
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var VehicleData = require('../vehicle-data.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Temperature'
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        super(options);

        this.currentTemperature = undefined;

        var service = new Service.TemperatureSensor(this.name, 'inside-temperature');
        this.addService(service);

        this.vehicle.on('vehicleData', (data) => {
            this.currentTemperature = data.getInsideTemperature();
            this.debug(`Updated inside temperature to ${this.currentTemperature}.`);  

            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
        });

        service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {
            callback(null, this.currentTemperature);
        });

        
    }; 
}

