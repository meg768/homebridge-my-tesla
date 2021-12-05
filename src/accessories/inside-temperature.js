var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        var config = {
            name: 'Inside'
        };

		super({...options, config:{...config, ...options.config}});

		this.temperature = 20;

		this.addService(new Service.TemperatureSensor(this.name));
        this.enableCharacteristic(Service.TemperatureSensor, Characteristic.CurrentTemperature, this.getTemperature.bind(this));

		this.getService(Service.TemperatureSensor).getCharacteristic(Characteristic.CurrentTemperature).setProps({
			minValue:-100,
			maxValue:100
		});

		this.vehicle.on('vehicle_data', (vehicleData) => {
			try {
				this.temperature = vehicleData.climate_state.inside_temp;
				this.debug(`Updating inner temperature to ${this.temperature}.`);
				this.updateCharacteristicValue(Service.TemperatureSensor, Characteristic.CurrentTemperature, this.temperature);
			}
			catch(error) {
				this.log(error);
			}
		});

        
    }

	getTemperature() {
		return this.temperature;
	}

}
