var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Ventilation"
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));
	
        this.vehicle.on('vehicle_data', async (vehicleData) => {    

			try {
				this.state = vehicleData.vehicle_state.fd_window != 0;
				this.debug(`Updating ventilation state to ${this.state ? 'ON' : 'OFF'}`);
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
			}
			catch(error) {
				this.log(error);
			}

        });
	}
	
	getState() {
		return this.state;
	}
	
    async setState(state) {
		try {
			state = state ? true : false;

			if (this.state != state) {
				this.debug(`Setting ${this.name} to state "${state}".`);

				var payload = {};
				payload.command = state ? 'vent' : 'close';
				payload.lat = 0;
				payload.lon = 0;

				if (payload.command == 'close') {
					var vehicleData = await this.vehicle.getVehicleData();
					payload.lat = vehicleData.drive_state.latitude;
					payload.lon = vehicleData.drive_state.longitude;
				}

				await this.vehicle.post('command/window_control', payload);
			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			this.vehicle.updateVehicleData(1000);
		}
    }	
}

