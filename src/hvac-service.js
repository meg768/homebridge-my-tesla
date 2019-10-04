
var Service = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Fan {

    constructor(tesla, name) {
        super(name, "hvac");

        this.on('update', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response && response.climate_state && response.climate_state.is_climate_on);
        });

        this.on('refresh', () => {                
            tesla.refresh((response) => {
                this.getCharacteristic(Characteristic.On).updateValue(response && response.climate_state && response.climate_state.is_climate_on);
            });
        });

        var getHVACState = (callback) => {

            tesla.refresh((response) => {
                callback(null, response && response.climate_state && response.climate_state.is_climate_on);
            });

        };

        var setHVACState = (value, callback) => {
            tesla.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return tesla.api.wakeUp(tesla.config.vin);
            })
            .then(() => {
                if (value)
                    return tesla.api.autoConditioningStart(tesla.config.vin);
                else
                    return tesla.api.autoConditioningStop(tesla.config.vin);
            })
            .then(() => {
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

