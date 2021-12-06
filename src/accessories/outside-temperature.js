var TemperatureSensor = require('./temperature.js');

module.exports = class extends TemperatureSensor {

    constructor(options) {
		super({...options, config:{...{name:'Outside'}, ...options.config}});
    }

	getTemperature(vehicleData) {
		return vehicleData.climate_state.outside_temp;
	}

}
