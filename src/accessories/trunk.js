var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');

var UNSECURED = Characteristic.LockCurrentState.UNSECURED;
var SECURED   = Characteristic.LockCurrentState.SECURED;
var JAMMED    = Characteristic.LockCurrentState.JAMMED;
var UNKNOWN   = Characteristic.LockCurrentState.UNKNOWN;

module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Trunk"
        };

		super({...options, config:{...config, ...options.config}});

        this.lockState = UNKNOWN;
        this.addService(new Service.LockMechanism(this.name));

		this.enableCharacteristic(Service.LockMechanism, Characteristic.LockCurrentState, this.getLockState.bind(this));
		this.enableCharacteristic(Service.LockMechanism, Characteristic.LockTargetState, this.getLockState.bind(this), this.setLockState.bind(this));

		this.vehicle.on('vehicle_data', (data) => {       
            this.lockState = (data.vehicle_state.rt == 0 ? SECURED : UNSECURED);

			this.debug(`Updated trunk lock status to ${this.lockState == SECURED ? 'SECURED' : 'UNSECURED'}.`);

			this.updateCharacteristicValue(Service.LockMechanism, Characteristic.LockTargetState, this.lockState);
			this.updateCharacteristicValue(Service.LockMechanism, Characteristic.LockCurrentState, this.lockState);
        });
    }


    getLockState() {
        return this.lockState;
    }

    async setLockState(value) {

		if (value == this.lockState)
			return;

		try {
			await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});
		}
		catch(error) {
			this.log(error);
		}
		finally {
			// Refresh after a while, it takes some time to open/close
			this.vehicle.getVehicleData(5000);
		}
    }


};


/*
module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Trunk"
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));
    }

	async updateState(state) {
		state = state ? true : false;

		if (state != this.state) {
			this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.state = state);
		}
	}

	getState() {
		return this.state;
	}

	async setState(state) {
		try {
			state = state ? true : false;

			if (state) {
				this.debug(`Setting trunk state to "${state}".`);
	
				await this.updateState(true);
				await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});

			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			await this.updateState(false);
		}
    }	
}
*/




