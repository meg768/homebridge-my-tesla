var {Service, Characteristic} = require('../homebridge.js');
var Switch = require('./core/switch.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Steering Wheel Heater"
        };

		super({...options, config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicle_data', (vehicleData) => {    
			var status = vehicleData.climate_state.steering_wheel_heater != 0;
			this.debug(`Updating steering wheel heating status to ${status ? 'ON' : 'OFF'}`);
			this.updateSwitchState(vehicleData.climate_state.steering_wheel_heater != 0);
        });
	}

    async turnOn() {
		try {
			await this.vehicle.post('command/remote_steering_wheel_heater_request', {on:true});

		}
		catch(error) {
			this.debug(error);
		}
		finally {
			this.vehicle.getVehicleData(1000);
		}
	}

    async turnOff() {
		try {
			await this.vehicle.post('command/remote_steering_wheel_heater_request', {on:false});

		}
		catch(error) {
			this.debug(error);
		}
		finally {
			this.vehicle.getVehicleData(1000);
		}
	}



}

