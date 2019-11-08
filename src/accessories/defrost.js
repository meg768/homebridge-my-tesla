
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
            temperatureRange: [15, 20],
            temperatureCheckFrequency: 5,
            requiredBatteryLevel: 60,
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
        this.requiredBatteryLevel = config.requiredBatteryLevel;
        this.timerInterval   = config.temperatureCheckFrequency * 1000 * 60;
        this.timer           = new Timer();

        this.enableSwitch();
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

    updateSwitchState() {
        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.isActive);
    }


    checkTemperature() {

        this.debug(`Checking temperatures for defrost feature...`);

        var ACTION_START_HVAC            = 1;
        var ACTION_STOP_HVAC             = 2;
        var ACTION_NONE                  = 4;
        var ACTION_STOP_TIMER            = 7;

        Promise.resolve().then(() => {
            return this.vehicle.getVehicleData();
        })
        .then((response) => {
            return {action:ACTION_NONE, vehicleData:response};
        })
        .then((response) => {
            var {vehicleData, action} = response;

            var insideTemperature = vehicleData.getInsideTemperature();
            var batteryLevel = vehicleData.getBatteryLevel();
            var isClimateOn = vehicleData.isClimateOn();
            var isPluggedIn = vehicleData.isCharging() || vehicleData.isChargingComplete() || vehicleData.isChargingStopped();

            if (!isPluggedIn) {
                this.log(`The car is not connected to a charger. Turning off defrosting since current charge state is "${vehicleData.getChargingState()}".`);
                action = ACTION_STOP_TIMER;
            }
            else if (insideTemperature < this.minTemperature) {
                if (!isClimateOn) {

                    if (batteryLevel < this.config.requiredBatteryLevel) {
                        this.log(`Battery level is ${batteryLevel}%. Will not activate air conditioning since it is below ${this.requiredBatteryLevel}%.`);
                    }
                    else {
                        this.debug(`Starting air conditioner.`);
                        action = ACTION_START_HVAC;
                    }    
                }
            }
            else if (insideTemperature > this.maxTemperature) {
                if (isClimateOn) {
                    this.debug(`Stopping air conditioner.`);
                    action = ACTION_STOP_HVAC;
                }
            }
            else {
                this.debug(`Current temperature is ${insideTemperature} and inside the limits of (${this.minTemperature} - ${this.maxTemperature}).`);
            }

            return ({vehicleData:vehicleData, action:action});
        })

        .then((response) => {
            var {vehicleData, action} = response;

            switch(action) {
                case ACTION_START_HVAC:
                case ACTION_STOP_HVAC: {

                    this.setAutoConditioningState(action == ACTION_START_HVAC ? true : false).then(() => {
                        // Call getVehicleData() so other stuff gets updated
                        return this.vehicle.getVehicleData();
                    })
                    .catch((error) => {
                        this.log(error);
                    })
                    break;
                }
            }

            return ({vehicleData:vehicleData, action:action});
        })

        .then((response) => {
            var {action} = response;

            switch(action) {
                case ACTION_STOP_TIMER: {
                    this.setActiveState(false).then(() => {
                        this.updateSwitchState();
                        return this.vehicle.getVehicleData();
                    })
                    .catch(() => {
                        this.log(error);
                    });

                    break;
                }
                default: {
                    this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));
                    break;
                }

            }

        })

        .catch((error) => {
            this.log(error);
        })

    }


    setAutoConditioningState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return value ? this.vehicle.autoConditioningStart() : this.vehicle.autoConditioningStop();
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
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            this.debug(`Setting defrost timer state to "${value}".`);
            this.timer.cancel();

            if (value) {
                this.checkTemperature();
                resolve();
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
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            this.debug(`Setting defrost state to "${value}".`);

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

