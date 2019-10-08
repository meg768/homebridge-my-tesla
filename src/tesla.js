"use strict";

var Events = require('events');
var API = require('./tesla-api.js');

var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var InnerTemperatureSensor = require('./inner-temperature-service.js');
var OuterTemperatureSensor = require('./outer-temperature-service.js');
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
        this.features = [];
        this.api = new API({log:this.log, debug:this.debug, vin:config.vin});
        this.platform = platform;
        this.refreshQueue = [];
        this.vehicleData = null;


        //this.services.push(new BatteryLevelService(this, "Batteri"));
        this.features.push(new AirConditionerService(this, "Fläkten"));
        this.features.push(new DoorLockService(this, "Dörren"));
        this.features.push(new InnerTemperatureSensor(this, "Temperatur"));
        this.features.push(new ChargingService(this, "Laddning"));
        //this.services.push(new OuterTemperatureSensor(this, "Ute"));
        //this.services.push(new DefrostService(this, "Frostfri"));

        //this.services.push(new AccessoryInformation());



        this.api.login().then((response) => {
            this.log('Login completed.');
            this.refresh();
        });
    }



    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    refresh() {
        var vin = this.config.vin;

        this.log(`Refreshing ${vin}...`);

        this.api.wakeUp().then(() => {
            return this.api.getVehicleData();         
        })
        .then((response) => {
            this.log('Wakeup OK, updating features...');
            var data = new VehicleData(response);

            this.features.forEach((feature) => {
                this.log('Fireing Wakeup OK to feateure...');
                feature.emit('refresh', data);
            });

            this.log('Updated features...');

        })
        .catch((error) => {
            this.log(error);
        });
    }
/*
    getVehicleData(callback) {

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
                    callback(new VehicleData(null));
                });
            })
            .then(() => {
                this.refreshQueue = [];
            })
        }
    }
*/
    
    getServices() {

        this.log('getServices() called.');

        var services = [];

        this.features.forEach((feature) => {
            services = services.concat(feature.getServices());
        });

        this.log(`${services.length} services found.`);

        return services;
    }

}
