
var Service  = require('../../homebridge.js').Service;
var Characteristic  = require('../../homebridge.js').Characteristic;
var Accessory = require('../../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        super(options);

        this.currentTemperature = undefined;

        this.addService(new Service.TemperatureSensor(this.name));

		this.vehicle.on('vehicle_data', (vehicleData) => {
			this.currentTemperature = this.getTemperature(vehicleData);
			this.updateCharacteristicValue(Service.TemperatureSensor, Characteristic.CurrentTemperature, this.currentTemperature);
		});


		this.enableCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature, this.getCurrentTemperature.bind(this));
        
    }; 

    getTemperature(vehicleData) {
        return 20;
    }

    getCurrentTemperature() {
        return this.currentTemperature;
    }
}

