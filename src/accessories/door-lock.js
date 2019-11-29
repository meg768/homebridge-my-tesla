var {Service, Characteristic} = require('../homebridge.js');
var Lock = require('./lock.js');


module.exports = class extends Lock {

    constructor(options) {
        var config = {
            "name": "Door"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicleData', (data) => {       
            this.lockTargetState = this.lockCurrentState = (data.vehicleState.isLocked() ? Lock.SECURED : Lock.UNSECURED);

            this.debug(`Updated door lock status to ${this.getLockStateName(this.lockCurrentState)}.`);

            this.updateLockCurrentState();
            this.updateLockTargetState();
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
