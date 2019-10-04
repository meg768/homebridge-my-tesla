
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "defrost");

        var defrostActive = false;
        var log = tesla.log;
        var interval = 60000;

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, defrostActive);    
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            callback(null, defrostActive = value);    
        });

        var isCharging = (response) => {
            var charging = false;
    
            if (response && response.charge_state) {
                switch (response.charge_state.charging_state) {
                    case 'Disconnected': {
                        charging = false;
                        break;
                    }
                    case 'Stopped': {
                        charging = false;
                        break;
                    }
                    default: {
                        charging = true;
                        break;
                    }
                }
            }

            return charging;
        };

        var isFreezing = (response) => {
            return (response && response.climate_state && response.climate_state.inside_temp <= 20);
        };

        var isAirConditionerOn = () => {
            return (response && response.climate_state && response.climate_state.is_climate_on);            
        };

        var loop = () => {
            var vin = tesla.config.vin;

            if (!defrostActive) {
                log(`Defrost not active...`);
                return setTimeout(loop.bind(this), interval);
            }

            log(`Checking temperature for vehicle ${vin}...`);

            tesla.api.wakeUp(vin).then(() => {
                return tesla.api.getVehicleData(vin);         
            })
            .then((response) => {
                if (!isCharging(response)) {
                    return Promise.resolve();
                }
                else if (isFreezing(response)) {
                    log('Starting air conditioner.');
                    return tesla.api.autoConditioningStart(vin);
                }
                else {
                    log('Stopping air conditioner.');
                    return tesla.api.autoConditioningStop(vin);        
                }
            })
            .then(() => {
                tesla.update();
            })
            .catch((error) => {
                log(error);
            })
            .then(() => {
                setTimeout(loop.bind(this), interval);
            })
        }

        loop();

    }
}; 

