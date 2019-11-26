
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');
var Switch = require('./switch.js');

const SwitchEx = (Base) => {

    return class extends Base {

        constructor(options) {
            console.log(`Constructing class Switch with arguments ${JSON.stringify(options)}...`)
            super(options);

            this.switchState = false;
            this.switchService = new Service.Switch(this.name);
        }


        updateSwitchState(value) {

            var updateValue = () => {
                this.switchService.getCharacteristic(Characteristic.On).updateValue(this.getSwitchState());
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
    
        getSwitchState() {
            return this.switchState;
        }
    
        setSwitchState(value) {
            value = value ? true : false;
    
            return new Promise((resolve, reject) => {
                Promise.resolve().then(() => {
                    if (this.switchState == value)
                        return Promise.resolve();
    
                    this.switchState = value;
                    this.debug(`Setting switch "${this.name}" state to "${this.switchState}".`);
                    return this.switchState ? this.turnOn() : this.turnOff();
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

class Ping extends SwitchEx(Accessory) {

    constructor(options) {

        var config = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5
        };

        super({...options, config:Object.assign({}, config, options.config)});
        
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

    turnOn() {
        return this.ping();
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     

    }


}


module.exports = Ping;