var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');

module.exports = class Lock extends Accessory {

    static UNSECURED = Characteristic.LockCurrentState.UNSECURED;
    static SECURED   = Characteristic.LockCurrentState.SECURED;
    static JAMMED    = Characteristic.LockCurrentState.JAMMED;
    static UNKNOWN   = Characteristic.LockCurrentState.UNKNOWN;

    constructor(options) {
        super(options);

        this.lockCurrentState = Lock.UNKNOWN;
        this.lockTargetState  = Lock.UNKNOWN;

        var service = new Service.LockMechanism(this.name);
        this.addService(service);

        this.enableCharacteristic(Service.LockMechanism, Characteristic.LockCurrentState, this.getLockCurrentState.bind(this));
        this.enableCharacteristic(Service.LockMechanism, Characteristic.LockTargetState, this.getLockTargetState.bind(this), this.setLockTargetState.bind(this));

/*
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

*/
    }

    getLockMechanism() {
        return this.getService(Service.LockMechanism);
    }

    updateLockCurrentState() {
        this.getLockMechanism().getCharacteristic(Characteristic.LockCurrentState).updateValue(this.lockCurrentState);
    }

    updateLockTargetState(value) {
        this.getLockMechanism().getCharacteristic(Characteristic.LockTargetState).updateValue(this.lockTargetState);
    }

    getLockCurrentState() {
        return this.lockCurrentState;
    }

    getLockTargetState() {
        return this.lockTargetState;
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

    setLockTargetState(value) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                this.log(`Turning lock "${this.name}" to state ${this.getLockStateName(value)}...`);
                return value ? this.lock() : this.unlock();

            })
            .then(() => {
                this.lockCurrentState = this.lockTargetState = value;
                this.updateCurrentLockState();
                return Promise.resolve();
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            })
        });

    }

    lock() {
        return Promise.resolve();
    }

    unlock() {
        return Promise.resolve();

    }


}



