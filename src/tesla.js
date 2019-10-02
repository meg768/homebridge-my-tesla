"use strict";

var Events   = require('events');
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;


var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var TemperatureSensor = require('./temperature-service.js');
var AccessoryInformation = require('./accessory-information-service.js');

module.exports = class Tesla extends Events  {

    constructor(platform, config) {

        super();

        this.log = platform.log;
        this.debug = platform.debug;
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.uuid = platform.generateUUID(config.vin);
        this.services = [];
        this.api = platform.api;
        this.platform = platform;
        this.refreshQueue = [];

        this.data = {};


        this.enableAccessoryInfo();
        this.enableDoorsLock();
        this.enableBatteryLevel();
        this.enableAirConditioner();
        this.enableTemperature();
        this.enableCharging();


        this.on('ready', () => {
            this.log('Ready!');

            this.refresh(() => {
                this.log('Initial refresh completed.');
            });
        });

    }

    enableCharging() {
        var service = new Service.Switch("Laddning");

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {

            this.refresh((response) => {
                var charging = false;

                if (response.charge_state) {
                    switch (response.charge_state.charging_state) {
                        case 'Disconnected': {
                            charging = false;
                            break;
                        }
                        case 'Stopped': {
                            charging = false;
                            break;
                        }
                        default: {
                            charging = true;
                            break;
                        }
                    }
                }

                callback(null, charging);
            });

        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var vin = this.config.vin;

            if (value) {
                Promise.resolve().then(() => {
                    return this.api.setChargePortDoorState(vin, true);
                })
                .then(() => {
                    return this.api.setChargeState(vin, true);
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })
            }
            else {
                Promise.resolve().then(() => {
                    return this.api.setChargeState(vin, false);    
                })
                .then(() => {
                    return this.api.setChargePortDoorState(vin, false);
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })

            }

        });



        this.services.push(service);

    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    refresh(callback) {

        this.refreshQueue.push(callback);

        if (this.refreshQueue.length == 1) {
            var vin = this.config.vin;

            this.log('Getting car state...');

            this.api.wakeUp(vin).then(() => {
                return this.api.getVehicleData(vin);         
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                this.log(error.stack);
            })
            .then((response) => {
                this.data = response;

                this.refreshQueue.forEach((callback) => {
                    callback(response);
                });

                this.log('Getting car state completed. Updated %d callbacks.', this.refreshQueue.length);
                this.refreshQueue = [];
            })
            .catch((error) => {
                this.log(error.stack);
            })
        }
    }



    enableTemperature() {
        var service = new TemperatureSensor(this, "Temperatur");
        this.services.push(service);
        return;

    }

    enableBatteryLevel() {
        var service = new BatteryLevelService(this, this.name);
        this.services.push(service);
    }

    enableAirConditioner() {
        var service = new AirConditionerService(this, "Fläkten");
        this.services.push(service);
        return;

    }

    enableDoorsLock() {
        var service = new DoorLockService(this, "Dörrar");
        this.services.push(service);
        return;
    }




    enableAccessoryInfo() {
        var service = new AccessoryInformation(this, {});
        this.services.push(service);

/*
        const service = new Service.AccessoryInformation();

        service.setCharacteristic(Characteristic.Manufacturer, 'meg768');
        service.setCharacteristic(Characteristic.Model, 'Tesla');
        service.setCharacteristic(Characteristic.SerialNumber, '1.0');

        this.services.push(service);
*/
    }

    getServices() {
        return this.services;
    }

}
