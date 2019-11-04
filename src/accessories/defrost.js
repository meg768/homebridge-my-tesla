
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.isActive = false;
        this.minTemperature = 14;
        this.maxTemperature = 15;
        this.timerInterval = 1 * 60000;
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
            this.debug(`Fetching vehicle temperature for defrost...`);


            this.vehicle.getVehicleData().then((data) => {

                var temperature = data.getInsideTemperature();

                if (temperature <= this.minTemperature) {
                    this.debug(`Inside temperature (${temperature}) is too low. Starting air conditioner.`);
                    return this.setAutoConditioningState(true);
                }
    
                if (temperature >= this.maxTemperature) {
                    this.debug(`Inside temperature (${temperature}) is too hight. Stopping air conditioner.`);
                    return this.setAutoConditioningState(false);
                }

                return Promise.resolve();
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
                resolve();
            }
    
        });
    }


    setAutoConditioningState(value) {
        return value ? this.api.autoConditioningStart() : this.api.autoConditioningStop();
    }

    setActiveState(value) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (value != this.isActive)
                    return this.setTimerState(value);
                else 
                    return Promise.resolve();
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

