
var Service = require('../homebridge.js').Service;
var Characteristic = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.isAirConditionerOn = undefined;

        this.enableFan();
    }

    enableFan() {
        var service = new Service.Fan(this.name, "hvac");
        this.addService(service);

        this.on('vehicleData', (data) => {    
            this.isAirConditionerOn = data.isAirConditionerOn();
            this.debug(`Updated HVAC status to ${this.isAirConditionerOn ? 'ON' : 'OFF'}.`);  
            service.getCharacteristic(Characteristic.On).updateValue(this.isAirConditionerOn);
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isAirConditionerOn);
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var setAirConditionerState = (value) => {
                return new Promise((resolve, reject) => {
                    if (value == this.isAirConditionerOn) {
                        resolve(this.isAirConditionerOn);
                    }
                    else {
                        Promise.resolve().then(() => {
                            if (value)
                                return this.api.autoConditioningStart();
                            else
                                return this.api.autoConditioningStop();
                        })
                        .then(() => {
                            resolve(this.isAirConditionerOn = value);
                        })            
                        .catch((error) => {
                            reject(error);
                        })
            
                    }


                });
            };

            setAirConditionerState(value).then(() => {
                callback(null, this.isAirConditionerOn);
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })

        });

        
    };


}

