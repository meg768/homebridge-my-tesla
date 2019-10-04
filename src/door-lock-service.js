
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.LockMechanism {

    constructor(tesla, name) {
        super(name, "door-lock");

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response.isVehicleLocked());
        });

        var getLockedState = (callback) => {

            tesla.getVehicleData((response) => {
                callback(null, response.isVehicleLocked());
            });
    
        };
    
        var setLockedState = (value, callback) => {
            tesla.log('Turning door lock to state %s.', value ? 'on' : 'off');
    
            Promise.resolve().then(() => {
                return tesla.api.wakeUp(tesla.config.vin);
            })
            .then(() => {
                if (value)
                    return tesla.api.doorLock(tesla.config.vin);
                else
                    return tesla.api.doorUnlock(tesla.config.vin);
            })
            .then(() => {
                if (!value)
                    return tesla.api.remoteStartDrive(tesla.config.vin);
                else
                    return Promise.resolve();
            })
            .then(() => {
                this.setCharacteristic(Characteristic.LockCurrentState, value); 
                callback(null, value);    
            })
    
            .catch((error) => {
                callback(null);
            })            
        };
    
        this.getCharacteristic(Characteristic.LockCurrentState).on('get', getLockedState.bind(this));
        this.getCharacteristic(Characteristic.LockTargetState).on('get', getLockedState.bind(this));
        this.getCharacteristic(Characteristic.LockTargetState).on('set', setLockedState.bind(this));
    
    }
}; 
