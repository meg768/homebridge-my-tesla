
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
            temperatureRange: [10, 13],
            temperatureCheckFrequency: 1,
            minBatteryLevel: 60,
        };

        var config = {...defaultConfig, ...this.config};

        if (config.temperatureRange == undefined)
            throw new Error('Must specify a temperatureRange for defrost accessory.');

        if (!isArray(config.temperatureRange) || config.temperatureRange.length != 2)
            throw new Error('Setting temperatureRange must be an array with two values for defrost accessory.');

        if (!isNumber(config.temperatureRange[0]) || !isNumber(config.temperatureRange[1]))
            throw new Error('The array temperatureRange must contain two numbers.');

        if (config.temperatureRange[0] >= config.temperatureRange[1])
            throw new Error('The array temperatureRange must contain ascending values for defrost accessory.');

        if (config.temperatureCheckFrequency == undefined)
            throw new Error('A temperatureCheckFrequency must be specified the number of minutes between checks.');

        this.isActive        = false;
        this.minTemperature  = config.temperatureRange[0];
        this.maxTemperature  = config.temperatureRange[1];
        this.minBatteryLevel = config.minBatteryLevel;
        this.timerInterval   = config.temperatureCheckFrequency * 1000 * 60;
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


    checkTemperature() {
        return new Promise((resolve, reject) => {
            this.vehicle.getVehicleData().then((data) => {

                var temperature = data.getInsideTemperature();
                var isClimateOn = data.isClimateOn();
                var batteryLevel = data.getBatteryLevel();
                var wantedTemperature = `[${this.minTemperature} - ${this.maxTemperature}]`;

                if (temperature <= this.minTemperature && !isClimateOn) {
                    this.debug(`Inside temperature (${temperature}) is too low. Wanting a temperature between ${wantedTemperature}. Starting air conditioner.`);

                    if (batteryLevel < this.minBatteryLevel) {
                        this.debug(`Battery level at ${batteryLevel}%. Must be at least ${this.minBatteryLevel}% to start air conditioner.`);
                        return Promise.resolve();   
                    }

                    return this.setAutoConditioningState(true);
                }
    
                if (temperature >= this.maxTemperature && isClimateOn) {
                    this.debug(`Inside temperature (${temperature}) is too high. Wanting a temperature between ${wantedTemperature}. Stopping air conditioner.`);
                    return this.setAutoConditioningState(false);
                }

                this.debug(`Inside temperature is in range ${wantedTemperature}.`);
                return Promise.resolve();   
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                // Seems we have to pause a bit so the air condition state is updated in getVehicleData()...
                return this.pause(0);
            })
            .then(() => {
                // Make sure to refresh all other accessories...
                return this.vehicle.getVehicleData();
            })
            .then(() => {
                this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));
                resolve();

            })
        })
    }


    setAutoConditioningState(value) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return value ? this.api.autoConditioningStart() : this.api.autoConditioningStop();
            })
            .then(() => {
                // Seems we have to pause a bit so the air condition state is updated in getVehicleData()...
                return this.pause(1000);
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);                
            })
        })
    }

    setTimerState(value) {
        return new Promise((resolve, reject) => {
            this.timer.cancel();

            if (value) {
                this.checkTemperature().then(() => {
                    this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
            }
            else {
                this.setAutoConditioningState(false).then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
            }
    
        });
    }

    setActiveState(value) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.setTimerState(value);
            })
            .then(() => {
                // Seems we have to pause a bit so the air condition state is updated in getVehicleData()...
                return this.pause(0);
            })
            .then(() => {
                return this.vehicle.getVehicleData();
            })
            .then(() => {
                resolve(this.isActive = value);
            })
            .catch((error) => {
                reject(error);
            })
    
        })
    }



}

