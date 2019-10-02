
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.LockMechanism {

    constructor(tesla, options) {
        super(options);

        var getLockedState = (callback) => {

            tesla.refresh((response) => {
                callback(null, response.vehicle_state && response.vehicle_state.locked);
    
            });
    
        };
    
        var setLockedState = (value, callback) => {
            tesla.log('Turning door lock to state %s.', value ? 'on' : 'off');
    
            Promise.resolve().then(() => {
                return tesla.api.wakeUp(tesla.config.vin);
            })
            .then(() => {
                return tesla.api.setDoorState(tesla.config.vin, value);
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

/*
enableDoorsLock() {
    var service = new Service.LockMechanism("Bildörren");

    
    this.services.push(service);
}
*/