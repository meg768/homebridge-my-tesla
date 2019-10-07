
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');

module.exports = class extends Service.LockMechanism {

    constructor(tesla, name) {
        super(name, "door-lock");

        
        this.on('refresh', (response) => {       
            tesla.log('Updating door status', response.isVehicleLocked());
            this.getCharacteristic(Characteristic.On).updateValue(response.isVehicleLocked());
        });

        var getLockedState = (callback) => {
            if (tesla.token) {
                tesla.api.log('Getting door locked state');

                tesla.api.getVehicleData((response) => {
                    tesla.api.log('Got door locked state');
                    response = new VehicleData(response);
                    tesla.api.log('Got door locked state', response);
                    callback(null, response.isVehicleLocked());
                })
                .catch((error) => {
                    tesla.api.log('Could not get vehicle data');
                    callback(null);
                    
                });
    
            }
            else {
                callback(null);
            }
    
        };
    
        var setLockedState = (value, callback) => {
            tesla.log('Turning door lock to state %s.', value ? 'on' : 'off');
    
            Promise.resolve().then(() => {
                return tesla.api.wakeUp();
            })
            .then(() => {
                if (value)
                    return tesla.api.doorLock();
                else
                    return tesla.api.doorUnlock();
            })
            .then(() => {
                if (!value)
                    return tesla.api.remoteStartDrive();
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
