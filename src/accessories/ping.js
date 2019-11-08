
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var isArray = require('yow/isArray');
var isNumber = require('yow/isNumber');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var defaultConfig = {
            requiredBatteryLevel   : 40,
            responseTimeout        : 5,
            responseCheckFrequency : 1000,
        };

        var config = {...defaultConfig, ...this.config};

        this.isActive               = false;
        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.responseTimeout        = config.responseTimeout * 60000;
        this.timer                  = new Timer();
        this.responseCheckFrequency = config.responseCheckFrequency;
        this.lastPing               = null;

        this.enableSwitch();

        this.vehicle.on('vehicleData', (vehicleData) => {    
            this.lastPing = new Date();
            this.updateSwitch(vehicleData);
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

    updateSwitch(vehicleData) {

        Promise.resolve().then(() => {
            if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                this.debug(`Battery level too low for ping to be enabled. Turning off.`);
                return this.setActiveState(false);
            }
            else
                return Promise.resolve();
    
        })
        .then(() => {
            this.debug(`Updated ping to state ${this.isActive ? 'ON' : 'OFF'}.`);        
            this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.isActive);

        })
    }

    ping() {
        var now = new Date();

        Promise.resolve().then(() => {

            if (this.lastPing == null) {
                this.debug(`No ping specified. Calling for the first time.`);
                return this.vehicle.getVehicleData();
            }

            if (this.lastPing && (now.valueOf() - this.lastPing.valueOf() > this.responseTimeout)) {
                this.debug(`Ping is old. Refreshing vehicle data.`);
                return this.vehicle.getVehicleData();
            }
            
        })
        .catch((error) => {
            this.log(error);
        })
        .then(() => {
            this.timer.setTimer(this.responseCheckFrequency, this.ping.bind(this));
        })



    }


    setTimerState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            this.debug(`Setting ping timer state to "${value}".`);
            this.timer.cancel();

            Promise.resolve().then(() => {
                return Promise.resolve();
            })
            .then(() => {
                if (value) {
                    this.ping();
                }
            })
            .then(() => {
                resolve();

            })
            .catch((error) => {
                this.log(error);
            })
        });
    }

    setActiveState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            if (this.isActive == value) {
                resolve();
            }
            else {
                this.debug(`Setting ping state to "${value}".`);

                Promise.resolve().then(() => {
                    return this.setTimerState(value);
                })
                .then(() => {
                    this.isActive = value;
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                });
    
            }
    
        })
    }



}

