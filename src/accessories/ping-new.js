
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');
var Switch = require('./switch.js');


var enableCharacteristicOn = (parent, service) => {

};
const CharacteristicOn = (Accessory) => {

    return class extends Accessory {

        enableOn(service) {
            this.onState = false;

            service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
                this.setOn(value).then(() => {
                })
                .catch((error) => {
                    this.log(error);
                })
                .then(() => {
                    callback();
                })
            });
    
            service.getCharacteristic(Characteristic.On).on('get', (callback) => {
                callback(null, this.getOn());
            });
    

        } 

        updateOn(value) {

            var updateValue = () => {
                this.getSwitchService().getCharacteristic(Characteristic.On).updateValue(this.getSwitchState());
                return Promise.resolve();
            };
    
            if (value == undefined) {
                return updateValue();
            }
            return new Promise((resolve, reject) => {
                this.setSwitchState(value).then(() => {
                    return updateValue();
                })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
            });
        }
    
        getOn() {
            return this.on;
        }
    
        setOnState(value) {
            value = value ? true : false;
    
            return new Promise((resolve, reject) => {
                Promise.resolve().then(() => {
                    if (this.onState == value)
                        return Promise.resolve();
    
                    this.onState = value;
                    this.debug(`Setting switch "${this.name}" state to "${this.onState}".`);
                    return this.onState ? this.turnOn() : this.turnOff();
                })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
            });
        }
    
        turnOn() {
            return Promise.resolve();
        }
    
        turnOff() {
            return Promise.resolve();
        }

    }
    
};

class Ping extends CharacteristicOn(Accessory) {

    constructor(options) {

        var config = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5
        };

        
        super({...options, config:Object.assign({}, config, options.config)});
        
        var service = new Service.Switch(this.name);
        this.addService(service);

        this.addCharacteristic(service, Characteristic.On, this.getSwitchState, this.setSwitchState);


        var timer = new Timer();
        var timerInterval = this.config.timerInterval * 60000;
        var requiredBatteryLevel = this.config.requiredBatteryLevel;

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getSwitchState()) {
                this.debug('Resetting ping timer.');
                timer.setTimer(timerInterval, this.ping.bind(this));
            }
            else
                timer.cancel();

        });

        this.vehicle.on('vehicleData', (vehicleData) => {

            if (this.getSwitchState() && (vehicleData.chargeState.getBatteryLevel() < requiredBatteryLevel)) {
                this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
                this.updateSwitchState(false).then(() => {
                })
                .catch((error) => {
                    this.log(error);
                })
            }
        });

    }

    getSwitchService() {
        return this.getService(Service.Switch);

    }

    turnOn() {
        return this.ping();
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     

    }


}


module.exports = Ping;