
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var isArray = require('yow/isArray');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        if (this.config.temperatureRange == undefined)
            throw new Error('Must specify a temperatureRange for defrost accessory.');

        if (!isArray(this.config.temperatureRange) || this.config.temperatureRange.length != 2)
            throw new Error('Setting temperatureRange must be an array with two values for defrost accessory.');

        if (this.config.temperatureRange[0] >= this.config.temperatureRange[1])
            throw new Error('The array temperatureRange must contain ascending values for defrost accessory.');

        if (this.config.temperatureCheckFrequency == undefined)
            throw new Error('A temperatureCheckFrequency must be specified.');

        this.minTemperature = this.config.temperatureRange[0];
        this.maxTemperature = this.config.temperatureRange[1];
        this.isActive = false;
        this.minTemperature = 16;
        this.maxTemperature = 17;
        this.timerInterval = this.config.temperatureCheckFrequency * 1000 * 60;
        this.timer = new Timer();

            
        this.enableSwitch();

    }

    enableSwitch() {
        var service = new Service.Switch(this.name, __filename);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isActive);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setActiveState(value).then((state) => {
                callback(null, state);
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
                var wantedTemperature = `[${this.minTemperature} - ${this.maxTemperature}]`;

                if (temperature <= this.minTemperature) {
                    this.debug(`Inside temperature (${temperature}) is too low. Wanting a temperature between ${wantedTemperature}. Starting air conditioner.`);
                    return this.setAutoConditioningState(true);
                }
    
                if (temperature >= this.maxTemperature) {
                    this.debug(`Inside temperature (${temperature}) is too high. Wanting a temperature between ${wantedTemperature}. Stopping air conditioner.`);
                    return this.setAutoConditioningState(false);
                }

                return Promise.resolve();   
            })
            .then(() => {
                // Update all accessories with new vehicle data...
                return this.vehicle.getVehicleData();
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));
                resolve();

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


    setAutoConditioningState(value) {
        return new Promise(() => {
            Promise.resolve().then(() => {
                return value ? this.api.autoConditioningStart() : this.api.autoConditioningStop();
            })
            .then(() => {
                return this.vehicle.getVehicleData();
            })
            .catch((error) => {
                reject(error);                
            })
        })
    }

    setActiveState(value) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.setTimerState(value);
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

