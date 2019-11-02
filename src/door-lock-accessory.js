var {Service, Characteristic} = require('./homebridge.js');

var Accessory = require('./vehicle-accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var service = new Service.LockMechanism(this.name, 'door-lock');
        this.addService(service);

/*
        this.on('refresh', (response) => {       
            this.log('Updating door status', response.isVehicleLocked());
            service.getCharacteristic(Characteristic.LockTargetState).updateValue(response.isVehicleLocked());
            service.getCharacteristic(Characteristic.LockCurrentState).updateValue(response.isVehicleLocked());
        });
*/
        var getLockedState = (callback) => {
            if (this.api.isOnline()) {
                this.log('Getting door locked state');

                Promise.resolve().then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    response = new VehicleData(response);
                    callback(null, response.isVehicleLocked());
                })
                .catch((error) => {
                    this.log('Could not get vehicle data to determine locked state.');
                    callback(null);
                    
                });
    
            }
            else {
                callback(null);
            }
        };
    
        var setLockedState = (value, callback) => {
            this.log('Turning door lock to state %s.', value ? 'on' : 'off');
    
            Promise.resolve().then(() => {
                return this.api.wakeUp();
            })
            .then(() => {
                if (value)
                    return this.api.doorLock();
                else
                    return this.api.doorUnlock();
            })
            .then(() => {
                if (!value)
                    return this.api.remoteStartDrive();
                else
                    return Promise.resolve();
            })
            .then(() => {
                service.setCharacteristic(Characteristic.LockCurrentState, value); 
                callback(null, value);    
            })
    
            .catch((error) => {
                callback(null);
            })            
        };
    
        service.getCharacteristic(Characteristic.LockCurrentState).on('get', getLockedState.bind(this));
        service.getCharacteristic(Characteristic.LockTargetState).on('get', getLockedState.bind(this));
        service.getCharacteristic(Characteristic.LockTargetState).on('set', setLockedState.bind(this));
    
    }

};
