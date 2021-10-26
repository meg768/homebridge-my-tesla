var {Service, Characteristic} = require('../homebridge.js');
var Lock = require('./core/lock.js');
var isString = require('yow/isString');


module.exports = class extends Lock {

    constructor(options) {
        var config = {
            "name": "Door"
        };

        super({...options, config:Object.assign({}, config, options.config)});

		this.vehicle.on('vehicle_data', (data) => {       
            var lockState = (data.vehicle_state.locked ? Lock.SECURED : Lock.UNSECURED);

            this.debug(`Updated door lock status to ${this.getLockStateName(lockState)}.`);

            this.updateLockCurrentState(lockState);
            this.updateLockTargetState(lockState);
        });


    }

    async lock() {
        return await this.vehicle.post('command/door_lock');
    }

	async unlock() {
        await this.vehicle.post('command/door_unlock');

		if (isString(this.config.remoteStartDrivePassword))
			await this.vehicle.post(`command/remote_start_drive?password=${this.config.remoteStartDrivePassword}`);

	}

};
