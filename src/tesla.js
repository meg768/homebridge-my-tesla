"use strict";

var Events   = require('events');
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;


var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var TemperatureSensor = require('./temperature-service.js');
var AccessoryInformation = require('./accessory-information-service.js');
var ChargingService = require('./charging-service.js');
var DefrostService = require('./defrost-service.js');
var VehicleData = require('./vehicle-data.js');

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

        this.services.push(new DefrostService(this, "Frostfri"));

        this.on('ready', () => {
            this.update();
            this.log('Ready!');
        });

    }



    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    update() {
        var vin = this.config.vin;

        this.log(`Updating ${vin}...`);

        this.api.wakeUp(vin).then(() => {
            return this.api.getVehicleData(vin);         
        })
        .then((response) => {
            var data = new VehicleData(response);

            this.services.forEach((service) => {
                service.emit('update', data);
            });
        })
        .catch((error) => {
            this.log(error);
        });
    }

    refresh(callback) {

        this.refreshQueue.push(callback);

        if (this.refreshQueue.length == 1) {
            var vin = this.config.vin;

            this.log(`Getting car state for ${vin}...`);

            this.api.wakeUp(vin).then(() => {
                return this.api.getVehicleData(vin);         
            })
            .then((response) => {
                var data = new VehicleData(response);

                this.refreshQueue.forEach((callback) => {
                    callback(data);
                });

                this.log('Getting car state completed. Updated %d callbacks.', this.refreshQueue.length);
            })
            .catch((error) => {
                this.log(error);

                this.refreshQueue.forEach((callback) => {
                    callback(null);
                });
            })
            .then(() => {
                this.refreshQueue = [];
            })
        }
    }

    enableCharging() {
        return this.services.push(new ChargingService(this, "Laddning"));
    }


    enableTemperature() {
        this.services.push(new TemperatureSensor(this, "Temperatur"));
    }

    enableBatteryLevel() {
        this.services.push(new BatteryLevelService(this, this.name));
    }

    enableAirConditioner() {
        this.services.push(new AirConditionerService(this, "Fläkten"));
    }

    enableDoorsLock() {
        this.services.push(new DoorLockService(this, "Dörrar"));
    }

    enableAccessoryInfo() {
        this.services.push(new AccessoryInformation(this, {}));
    }

    getServices() {
        return this.services;
    }

}
