var {Service, Characteristic} = require('../homebridge.js');

var Accessory = require('../accessory.js');

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
            this.currentState = data.isVehicleLocked() ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
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
