
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Fan {

    constructor(tesla, options) {
        super(options);

        var getHVACState = (callback) => {

            tesla.refresh((response) => {
                callback(null, response.climate_state && response.climate_state.is_climate_on);
            });
        
        };
        
        var setHVACState = (value, callback) => {
            console.log('fdsgsgsfd');
            tesla.log('Turning HVAC state to %s.', value ? 'on' : 'off');
        
            Promise.resolve().then(() => {
                console.log('wakeup');
                return tesla.api.wakeUp(tesla.config.vin);
            })
            .then(() => {
                console.log('fdsgsgsfd XXX');
                return tesla.api.setAutoConditioningState(tesla.config.vin, value);
            })
            .then(() => {
                console.log('YYY');
                callback(null, value);    
            })
        
            .catch((error) => {
                tesla.log(error);
                callback(null);
            })            
        };
        
        this.getCharacteristic(Characteristic.On).on('get', getHVACState.bind(this));
        this.getCharacteristic(Characteristic.On).on('set', setHVACState.bind(this));
        
        
    }; 
}

