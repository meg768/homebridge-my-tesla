
var Service = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name, subname) {
        super(tesla);

        var service = new Service.Fan(name, subname);
        var api = tesla.api;

        this.on('refresh', (response) => {              
            this.log('Updating HVAC status to', response.isAirConditionerOn());  
            service.getCharacteristic(Characteristic.On).updateValue(response.isAirConditionerOn());
        });

        var getHVACState = (callback) => {
            if (api.token) {
                api.getVehicleData((response) => {
                    response = new VehicleData(response);
                    callback(null, response.isAirConditionerOn());
                });
    
            }
            else
                callback(null);

        };

        var setHVACState = (value, callback) => {
            this.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return api.wakeUp();
            })
            .then(() => {
                if (value)
                    return api.autoConditioningStart();
                else
                    return api.autoConditioningStop();
            })
            .then(() => {
                callback(null, value);
            })

            .catch((error) => {
                this.log(error);
                callback(null);
            })
        };

        service.getCharacteristic(Characteristic.On).on('get', getHVACState.bind(this));
        service.getCharacteristic(Characteristic.On).on('set', setHVACState.bind(this));

        this.addService(service);

    };
}
/*
module.exports = class extends Service.Fan {

    constructor(tesla, name) {
        super(name, "hvac");

        this.on('refresh', (response) => {              
            tesla.log('Updating HVAC status to', response.isAirConditionerOn());  
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

*/