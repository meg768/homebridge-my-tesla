var Fan = require('./core/fan.js');

module.exports = class extends Fan {

    constructor(options) {
        var config = {
            "name": "Fan"
        };

        super({...options, config:Object.assign({}, config, options.config)});
		
		this.vehicle.on('vehicle_data', (vehicleData) => {    
            //var fanStatus = vehicleData.climate_state.fan_status;
			var isClimateOn = vehicleData.climate_state.is_climate_on;
			var status = isClimateOn;
			this.debug(`Updated HVAC status to ${status ? 'ON' : 'OFF'}.`);
            this.updateFanState(status);
        });

    }

    async turnOn() {
        await this.vehicle.post('command/auto_conditioning_start');
		this.vehicle.getVehicleData(1000);
    }

    async turnOff() {
        await this.vehicle.post('command/auto_conditioning_stop');
		this.vehicle.getVehicleData(1000);
    }


}


