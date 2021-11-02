var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');
var isString = require('yow/isString');

var UNSECURED = Characteristic.LockCurrentState.UNSECURED;
var SECURED   = Characteristic.LockCurrentState.SECURED;
var JAMMED    = Characteristic.LockCurrentState.JAMMED;
var UNKNOWN   = Characteristic.LockCurrentState.UNKNOWN;


module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Doors"
        };

		super({...options, config:{...config, ...options.config}});

        this.lockState = UNKNOWN;

        this.addService(new Service.LockMechanism(this.name));

		this.enableCharacteristic(Service.LockMechanism, Characteristic.LockCurrentState, this.getLockState.bind(this));
		this.enableCharacteristic(Service.LockMechanism, Characteristic.LockTargetState, this.getLockState.bind(this), this.setLockState.bind(this));

		this.vehicle.on('vehicle_data', (data) => {       
            this.lockState = (data.vehicle_state.locked ? SECURED : UNSECURED);

			this.debug(`Updated door lock status to ${this.lockState == SECURED ? 'SECURED' : 'UNSECURED'}.`);

			this.getService(Service.LockMechanism).getCharacteristic(Characteristic.LockTargetState).updateValue(this.lockState); 
			this.getService(Service.LockMechanism).getCharacteristic(Characteristic.LockCurrentState).updateValue(this.lockState);
	
        });
    }


    getLockState() {
        return this.lockState;
    }

    async setLockState(value) {
		try {
			if (value) {
				await this.vehicle.post('command/door_lock');
			}
			else {
				await this.vehicle.post('command/door_unlock');
				
				if (isString(this.config.remoteStartDrivePassword))
					await this.vehicle.post(`command/remote_start_drive?password=${this.config.remoteStartDrivePassword}`);
			}
	
		}
		catch(error) {
			this.log(error);

		}
		finally {
			this.vehicle.getVehicleData(1000);
		}
    }


};
