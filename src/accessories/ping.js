
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');


class Switch extends Accessory {

    constructor(options) {

        super(options);
        
        this.switchState = false;

        this.addService(new Service.Switch(this.name));

        this.getService(Service.Switch).getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setSwitchState(value).catch((error) => {
                this.log(error);
            })
            .then(() => {
                callback();
            })
        });

        this.getService(Service.Switch).getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getSwitchState());
        });
    }

    updateSwitchState() {
        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.getSwitchState());
        return Promise.resolve();
    }

    getSwitchState() {
        return this.switchState;
    }

    setSwitchState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.switchState != value) {
                    this.switchState = value;
                    this.debug(`Setting switch "${this.name}" state to "${this.switchState}".`);
                    return this.switchState ? this.turnOn() : this.turnOff();
                }
                else {
                    return Promise.resolve();
                }
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
        return this.resolve();
    }

    turnOff() {
        return this.resolve();
    }

}




module.exports = class extends Switch {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5,
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});
        
        var timer = new Timer();
        var timerInterval = this.config.timerInterval * 60000;
        var requiredBatteryLevel = this.config.requiredBatteryLevel;

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getPingState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                timer.setTimer(timerInterval, this.ping.bind(this));
            }
            else
                timer.cancel();

        });

        this.vehicle.on('vehicleData', (vehicleData) => {

            if (this.getPingState() && (vehicleData.getBatteryLevel() < requiredBatteryLevel)) {
                this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
                this.setSwitchState(false).then(() => {
                    return this.updateSwitchState();
                })
                .catch((error) => {
                    this.log(error);
                })
            }
        });

    }

    turnOn() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
    }


}


