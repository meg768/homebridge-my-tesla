
var Service = require('../homebridge.js').Service;
var Characteristic = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Switch = require('./switch.js');


module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Fan"
        };

        super({...options, switchType:'fan', config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicleData', (vehicleData) => {    
            var isClimateOn = vehicleData.climateState.isClimateOn();
            this.debug(`Updated HVAC status to ${isClimateOn ? 'ON' : 'OFF'}.`);
            this.updateSwitchState(isClimateOn);
        });

    }

    turnOn() {
        return this.vehicle.autoConditioningStart();
    }

    turnOff() {
        return this.vehicle.autoConditioningStop();
    }


}



class Kalle extends Accessory {

    constructor(options) {
        var config = {
            "name": "Fan"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.isClimateOn = undefined;

        this.enableFan();
    }

    enableFan() {
        var service = new Service.Fan(this.name, __filename);
        this.addService(service);

        this.vehicle.on('vehicleData', (data) => {    
            this.isClimateOn = data.climateState.isClimateOn();
            this.debug(`Updated HVAC status to ${this.isClimateOn ? 'ON' : 'OFF'}.`);  
            service.getCharacteristic(Characteristic.On).updateValue(this.isClimateOn);
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isClimateOn);
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var setAirConditionerState = (value) => {
                return new Promise((resolve, reject) => {
                    if (value == this.isClimateOn) {
                        resolve(this.isClimateOn);
                    }
                    else {
                        Promise.resolve().then(() => {
                            if (value)
                                return this.vehicle.autoConditioningStart();
                            else
                                return this.vehicle.autoConditioningStop();
                        })
                        .then(() => {
                            this.isClimateOn = value;
                            resolve();
                        })
                        .catch((error) => {
                            reject(error);
                        })
                    }
                });
            };

            setAirConditionerState(value).then(() => {
                callback(null, this.isClimateOn);
            })

            .catch((error) => {
                this.log(error);
                callback(null);
            })

        });

        
    };


}

