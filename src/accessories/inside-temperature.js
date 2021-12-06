var TemperatureSensor = require('./temperature.js');

module.exports = class extends TemperatureSensor {

    constructor(options) {
		super({...options, config:{...{name:'Inside'}, ...options.config}});
    }

	getTemperature(vehicleData) {
		return vehicleData.climate_state.inside_temp;
	}

}
