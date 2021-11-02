var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

        var config = {
            name: 'Inside'
        };

		super({...options, config:{...config, ...options.config}});

		this.addService(new Service.TemperatureSensor(this.name));

		this.vehicle.on('vehicle_data', (vehicleData) => {
			this.updateCharacteristicValue(Service.TemperatureSensor, Characteristic.CurrentTemperature, vehicleData.climate_state.inside_temp);
		});

        
    }

}
