var {Service, Characteristic} = require('../homebridge.js');
var Lock = require('./lock.js');


module.exports = class extends Lock {

    constructor(options) {
        var config = {
            "name": "Door"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicleData', (data) => {       
            var lockState = (data.vehicleState.isLocked() ? Lock.SECURED : Lock.UNSECURED);

            this.debug(`Updated door lock status to ${this.getLockStateName(lockState)}.`);

            this.updateLockCurrentState(lockState);
            this.updateLockTargetState(lockState);
        });

    }

    lock() {
        return this.vehicle.doorLock();
    }

    unlock() {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.vehicle.doorUnlock();
            })
            .then(() => {
                return this.vehicle.remoteStartDrive();
            })
            .then(() => {
                resolve();    
            })
            .catch((error) => {
                reject(error);
            })            
        });
    }


};
