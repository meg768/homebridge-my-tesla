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

		this.vehicle.on('vehicle_data', async (vehicleData) => {    
			
			try {
				this.lockState = (vehicleData.vehicle_state.rt == 0 ? SECURED : UNSECURED);

				await this.pause(500);
				
				this.debug(`Updating trunk lock status to ${this.lockState == SECURED ? 'SECURED' : 'UNSECURED'}.`);
				this.updateCharacteristicValue(Service.LockMechanism, Characteristic.LockTargetState, this.lockState);
				this.updateCharacteristicValue(Service.LockMechanism, Characteristic.LockCurrentState, this.lockState);	
			}
			catch(error) {
				this.log(error);

			}
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
			this.vehicle.updateVehicleData(5000);
		}
    }


};

