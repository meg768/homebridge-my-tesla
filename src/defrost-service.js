
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var Schedule = require('node-schedule');

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "defrost");

        var defrostActive = false;
        var log = tesla.log;

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, defrostActive);    
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            callback(null, defrostActive = value);    
        });

        var loop = () => {
            var vin = tesla.config.vin;

            if (!defrostActive) {
                log(`Defrost not active...`);
                return setTimeout(loop.bind(this), 60000);
            }

            log(`Checking temperature for vehicle ${vin}...`);

            tesla.api.wakeUp(vin).then(() => {
                return tesla.api.getVehicleData(vin);         
            })
            .then((response) => {
                if (response && response.climate_state && response.climate_state.inside_temp < 4) {
                    log('Starting air conditioner.');
                    return Promise.resolve();
                    return tesla.api.autoConditioningStart(vin);
                }
                else {
                    log('Stopping air conditioner.');
                    return Promise.resolve();
                    return tesla.api.autoConditioningStop(vin);    
                }
            })
            .catch((error) => {
                log(error);
            })
            .then(() => {
                setTimeout(loop.bind(this), 60000);
            })
        }

        loop();

    }
}; 

