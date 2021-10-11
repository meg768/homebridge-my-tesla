var {Service, Characteristic} = require('../homebridge.js');
var Lock = require('./core/lock.js');


module.exports = class extends Lock {

    constructor(options) {
        var config = {
            "name": "Door"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.enableRemoteStartDrive = (this.config.enableRemoteStartDrive == undefined) ? true : this.config.enableRemoteStartDrive;



		this.vehicle.on('vehicle_data', (data) => {       
            var lockState = (data.vehicle_state.locked ? Lock.SECURED : Lock.UNSECURED);

            this.debug(`Updated door lock status to ${this.getLockStateName(lockState)}.`);

            this.updateLockCurrentState(lockState);
            this.updateLockTargetState(lockState);
        });


    }

    lock() {
        return this.vehicle.post('command/door_lock');
    }

	unlock() {
        return this.vehicle.post('command/door_unlock');

	}
/*
    unlock() {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.vehicle.doorUnlock();
            })
            .then(() => {
                if (this.enableRemoteStartDrive) {
                    this.debug('Remote start drive is enabled.');
                    return this.vehicle.remoteStartDrive();
                }
                else {
                    this.debug('Remote start drive is disabled.');
                    return Promise.resolve();
                }
            })
            .then(() => {
                resolve();    
            })
            .catch((error) => {
                reject(error);
            })            
        });
    }
*/

};
