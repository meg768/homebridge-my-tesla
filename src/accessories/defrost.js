
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
            temperatureRange: [8, 10],
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

            var ACTION_START_HVAC            = 1;
            var ACTION_STOP_HVAC             = 2;
            var ACTION_NONE                  = 3;
            var ACTION_BATTERY_LEVEL_TOO_LOW = 5;
            var ACTION_STABLE                = 8;

            Promise.resolve().then(() => {
                return this.vehicle.getVehicleData();
            })
            .then((response) => {
                var vehicleData = response;
                var action = ACTION_NONE;
                var insideTemperature = vehicleData.getInsideTemperature();
                var batteryLevel = vehicleData.getBatteryLevel();
                var isClimateOn = vehicleData.isClimateOn();

                if (insideTemperature < this.minTemperature) {
                    action = ACTION_START_HVAC;

                    if (batteryLevel < this.config.minBatteryLevel) {
                        action = ACTION_BATTERY_LEVEL_TOO_LOW;
                    }
                }
                else if (insideTemperature > this.maxTemperature) {
                    action = ACTION_STOP_HVAC;
                }
                else {
                    action = ACTION_STABLE;
                }

                if (action == ACTION_START_HVAC && isClimateOn)
                    action = ACTION_NONE;

                if (action == ACTION_STOP_HVAC && !isClimateOn)
                    action = ACTION_NONE;

                return ({vehicleData:vehicleData, action:action});
            })

            .then((response) => {
                var {vehicleData, action} = response;

                var insideTemperature = vehicleData.getInsideTemperature();
                var batteryLevel = vehicleData.getBatteryLevel(); 
                var validTemperatureRange = `(${this.minTemperature} - ${this.maxTemperature})`;

                switch(action) {
                    case ACTION_NONE: {
                        this.debug(`No action.`);
                        break;
                    }
                    case ACTION_BATTERY_LEVEL_TOO_LOW: {
                        this.debug(`Battery level is ${batteryLevel}%. Will not activate air conditioning since it is below ${this.minBatteryLevel}.`);
                        break;
                    }
                    case ACTION_STABLE: {
                        this.debug(`Current temperature is ${insideTemperature}, inside the limits of ${validTemperatureRange}.`);
                        break;
                    }
                    case ACTION_START_HVAC:
                    case ACTION_STOP_HVAC: {

                        if (action == ACTION_START_HVAC) {
                            this.debug(`Starting air conditioner.`);
                        }
                        if (action == ACTION_STOP_HVAC) {
                            this.debug(`Stopping air conditioner.`);
                        }
cc
                        this.setAutoConditioningState(action == ACTION_START_HVAC ? true : false).then(() => {
                            return this.vehicle.getVehicleData();
                        })
                        .catch(() => {
                            this.log(error);
                        })
                        break;
                    }
                }
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                // Seems we have to pause a bit so the air condition state is updated in getVehicleData()...
                return this.pause(0);
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

