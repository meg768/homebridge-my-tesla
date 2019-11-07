
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var isArray = require('yow/isArray');
var isNumber = require('yow/isNumber');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.isActive        = false;
        this.timerInterval   = 2 * 1000 * 60;
        this.minBatteryLevel = 95;
        this.timer           = new Timer();

        this.enableSwitch();
    }

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    enableSwitch() {
        var service = new Service.Switch(this.name, __filename);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isActive);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setActiveState(value).then(() => {
                callback(null, this.isActive);
            })
            .catch((error) => {
                this.log(error);
                callback(null);

            })
        });
    }

    updateSwitch() {
        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.isActive);
    }

    ping() {
        return new Promise((resolve, reject) => {

            this.debug(`Ping!`);

            Promise.resolve().then(() => {
                return this.vehicle.getVehicleData();
            })
            .then((vehicleData) => {
                if (vehicleData.getBatteryLevel() < this.minBatteryLevel) {
                    this.debug(`Battery level too low for ping to be anbled. Turning off.`);
                    return this.setActiveState(false);                    
                }
                else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                this.updateSwitch();
                resolve();
            })
        })
    }



    setTimerState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            this.debug(`Setting ping timer state to "${value}".`);
            this.timer.cancel();

            if (value)
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));            
            
            resolve();
    
        });
    }

    setActiveState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            this.debug(`Setting ping state to "${value}".`);

            Promise.resolve().then(() => {
                if (this.isActive != value)
                    return this.setTimerState(value);
                else
                    return Promise.resolve();
            })
            .then(() => {
                this.isActive = value;
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    
        })
    }



}

