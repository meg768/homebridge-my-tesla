var {Service, Characteristic} = require('../homebridge.js');

var Accessory = require('../accessory.js');

class Lock extends Accessory {

    static UNSECURED = Characteristic.LockCurrentState.UNSECURED;
    static SECURED   = Characteristic.LockCurrentState.SECURED;
    static JAMMED    = Characteristic.LockCurrentState.JAMMED;
    static UNKNOWN   = Characteristic.LockCurrentState.UNKNOWN;

    constructor(options) {
        super(options);

        this.currentLockState = Lock.UNKNOWN;
        this.targetLockState  = Lock.UNKNOWN;

        var service = new Service.LockMechanism(this.name);
        this.addService(service);

        service.getCharacteristic(Characteristic.LockCurrentState).on('get', (callback) => {
            callback(null, this.getCurrentLockState());
        });

        service.getCharacteristic(Characteristic.LockTargetState).on('get', (callback) => {
            callback(null, this.getTargetLockState());
        });

        service.getCharacteristic(Characteristic.LockTargetState).on('set', (value, callback) => {

            this.setTargetLockState(value).then(() => {
                callback(null, this.getTargetLockState());

            })        
            .catch((error) => {
                this.log(error);
                callback(null);
            })
        });
    }

    getLockMechanismService() {
        return this.getService(Service.LockMechanism);
    }

    updateCurrentLockState() {
        var service = this.getLockMechanismService();
        service.getCharacteristic(Characteristic.LockCurrentState).updateValue(this.currentLockState);
    }

    updateTargetLockState(value) {
        var service = this.getLockMechanismService();
        service.getCharacteristic(Characteristic.LockTargetState).updateValue(this.targetLockState);
    }

    getCurrentLockState() {
        return this.currentLockState;
    }

    getTargetLockState() {
        return this.targetLockState;
    }

    getLockStateName(state) {
        switch(state) {
            case Lock.SECURED: {
                return 'SECURED';
            }
            case Lock.UNSECURED: {
                return 'UNSECURED';
            }
        }

        return 'UNKNOWN';
    }

    setTargetLockState(value) {
        return new Promise((resolve, reject) => {
            if (value === this.targetLockState)
                resolve();
            else {
                Promise.resolve().then(() => {
                    this.log(`Turning lock "${this.name}" to state ${this.getLockStateName(value)}...`);
                    return value ? this.lock() : this.unlock();
    
                })
                .then(() => {
                    this.currentLockState = this.targetLockState = value;
                    this.updateCurrentLockState();
                    return Promise.resolve();
                })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
            }
        });

    }

    lock() {
        return Promise.resolve();
    }

    unlock() {
        return Promise.resolve();

    }


}


module.exports = class extends Accessory {

    constructor(options) {
        var defaultConfig = {
            "name": "Door",
            "enabled": true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.currentState = Characteristic.LockCurrentState.UNKNOWN;
        this.targetState  = undefined;

        this.enableLockMechanism();
    }

    enableLockMechanism() {
        var service = new Service.LockMechanism(this.name, 'door-lock');
        this.addService(service);

        this.vehicle.on('vehicleData', (data) => {       
            this.currentState = data.vehicleState.isLocked() ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
            this.targetState = this.currentState;

            this.debug(`Updated door lock status to ${this.currentState ? 'LOCKED' : 'UNLOCKED'}.`);

            service.getCharacteristic(Characteristic.LockTargetState).updateValue(this.targetState);
            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(this.currentState);
        });

        service.getCharacteristic(Characteristic.LockCurrentState).on('get', (callback) => {
            callback(null, this.currentState);
        });

        service.getCharacteristic(Characteristic.LockTargetState).on('get', (callback) => {
            callback(null, this.targetState);
        });

        service.getCharacteristic(Characteristic.LockTargetState).on('set', (value, callback) => {

            var setTargetState = (value) => {
                return new Promise((resolve, reject) => {
                    if (value === this.targetState)
                        resolve();
                    else {
                        this.log(`Turning door lock to state ${value ? 'ON' : 'OFF'}...`);
        
                        var service = this.getService(Service.LockMechanism);
                
                        Promise.resolve().then(() => {
                            if (value)
                                return this.vehicle.doorLock();
                            else
                                return this.vehicle.doorUnlock();
                        })
                        .then(() => {
                            if (!value)
                                return this.vehicle.remoteStartDrive();
                            else
                                return Promise.resolve();
                        })
                        .then(() => {
                            this.currentState = this.targetState = value;
                            service.setCharacteristic(Characteristic.LockCurrentState, value); 
                            resolve();    
                        })
                        .catch((error) => {
                            reject(error);
                        })            
                
                    }
        
                });
                 
            };
        
            setTargetState(value).then(() => {
                callback(null, this.targetState);
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })
        });    
    }

};




module.exports = class extends Lock {

    constructor(options) {
        var defaultConfig = {
            "name": "Door",
            "enabled": true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.vehicle.on('vehicleData', (data) => {       
            this.targetLockState = this.currentLockState = (data.vehicleState.isLocked() ? Lock.SECURED : Lock.UNSECURED);

            this.debug(`Updated door lock status to ${this.getLockStateName(this.currentLockState)}.`);

            this.updateCurrentLockState();
            this.updateTargetLockState();
        });

    }


};
