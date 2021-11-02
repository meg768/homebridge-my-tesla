var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Steering Wheel Heater"
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));
	
        this.vehicle.on('vehicle_data', (vehicleData) => {    
			this.state = vehicleData.climate_state.steering_wheel_heater != 0;
			this.debug(`Updating steering wheel heating status to ${this.state ? 'ON' : 'OFF'}`);

			this.pause(1000, () => {
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
			});

        });
	}
	
	getState() {
		return this.state;
	}
	
    async setState(state) {
		try {
			state = state ? true : false;

			if (this.state != state) {
				this.state = state;

				this.debug(`Setting ${this.name} to state "${this.state}".`);

				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
				await this.vehicle.post('command/remote_steering_wheel_heater_request', {on:state});
			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			await this.vehicle.getVehicleData(1000);
		}
    }	
}

