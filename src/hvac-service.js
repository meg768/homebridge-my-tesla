
var Service = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');

module.exports = class extends Service.Fan {

    constructor(tesla, name) {
        super(name, "hvac");

        this.on('refresh', (response) => {                
            this.getCharacteristic(Characteristic.On).updateValue(response.isAirConditionerOn());
        });

        var getHVACState = (callback) => {
            if (tesla.token) {
                tesla.api.getVehicleData((response) => {
                    response = new VehicleData(response);
                    callback(null, response.isAirConditionerOn());
                });
    
            }
            else
                callback(null);

        };

        var setHVACState = (value, callback) => {
            tesla.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return tesla.api.wakeUp();
            })
            .then(() => {
                if (value)
                    return tesla.api.autoConditioningStart();
                else
                    return tesla.api.autoConditioningStop();
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

