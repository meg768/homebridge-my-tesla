var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "HVAC"
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.addService(new Service.Fan(this.name));
        this.enableCharacteristic(Service.Fan, Characteristic.On, this.getState.bind(this), this.setState.bind(this));

		this.vehicle.on('vehicle_data', (vehicleData) => {    
			this.state = vehicleData.climate_state.is_climate_on;
			this.debug(`Updated HVAC status to ${this.state ? 'ON' : 'OFF'}.`);
			this.getService(Service.Fan).getCharacteristic(Characteristic.On).updateValue(this.state);
        });

    }

    getState() {
        return this.state;
    }

    async setState(value) {
		try {
			value = value ? true : false;

			if (this.state != value) {
				this.debug(`Setting HVAC state to "${value}".`);
	
				if (value) {
					await this.vehicle.post('command/auto_conditioning_start');
				}
				else {
					await this.vehicle.post('command/auto_conditioning_stop');
				}	
			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			this.vehicle.getVehicleData(1000);
		}
    }	



}


