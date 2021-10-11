var Fan = require('./core/fan.js');

module.exports = class extends Fan {

    constructor(options) {
        var config = {
            "name": "Fan"
        };

        super({...options, config:Object.assign({}, config, options.config)});

		
		this.vehicle.on('vehicle_data', (vehicleData) => {    
            var isClimateOn = vehicleData.climate_state.is_climate_on;
            this.debug(`Updated HVAC status to ${isClimateOn ? 'ON' : 'OFF'}.`);
            this.updateFanState(isClimateOn);
        });

    }

    turnOn() {
        return this.vehicle.post('command/auto_conditioning_start');
    }

    turnOff() {
        return this.vehicle.post('command/auto_conditioning_stop');
    }


}


