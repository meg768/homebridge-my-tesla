var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {

		super(options);

		this.temperature = 20;

		this.addService(new Service.TemperatureSensor(this.name));
        this.enableCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature, this.getCurrentTemperature.bind(this));

		this.getCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature).setProps({
			minValue:-100,
			maxValue:100
		});

		this.vehicle.on('vehicle_data', (vehicleData) => {
			try {
				this.temperature = this.getTemperature(vehicleData);
				this.debug(`Updating temperature '${this.config.name}' to ${this.temperature}.`);
				this.getCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature).updateValue(this.temperature);
			}
			catch(error) {
				this.log(error);
			}
		});
    }

	getCurrentTemperature() {
		return this.temperature;
	}

	getTemperature(vehicleData) {
		return this.temperature;
	}

}
