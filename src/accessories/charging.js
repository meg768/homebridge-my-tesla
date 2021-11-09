var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Charging"
        };


		super({...options, config:{...config, ...options.config}});

		this.state = false;
		this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));

		this.vehicle.on('vehicle_data', async (vehicleData) => {    

			try {
				this.state = vehicleData.charge_state.charging_state == "Charging";
				this.debug(`Updating charging state to ${this.state}.`);
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
			if (state != this.state) {
				await this.vehicle.post(`command/charge_${state ? 'start' : 'stop'}`);
			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			this.vehicle.updateVehicleData();
		}

	}

}

