var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');

module.exports = class Lock extends Accessory {

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



