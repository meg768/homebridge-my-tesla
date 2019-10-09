"use strict";

var Events = require('events');
var API = require('./tesla-api.js');

var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var InnerTemperatureSensor = require('./inner-temperature-service.js');
var OuterTemperatureSensor = require('./outer-temperature-service.js');
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

        this.features.push(new BatteryLevelService(this, "Batteri"));
        this.features.push(new AirConditionerService(this, "Fläkten"));
        this.features.push(new DoorLockService(this, "Dörren"));
        this.features.push(new InnerTemperatureSensor(this, "Inne"));
        this.features.push(new OuterTemperatureSensor(this, "Ute"));
        this.features.push(new ChargingService(this, "Laddning"));

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

        Promise.resolve().then(() => {
            return this.api.wakeUp();
        })
        .then(() => {
            return this.api.getVehicleData();
        })
        .then((response) => {
            var data = new VehicleData(response);

            this.features.forEach((feature) => {
                feature.emit('refresh', data);
            });

            this.log('Refreshed features...');
        })
        .catch((error) => {
            this.log(error);
        });
    }
    
    getServices() {

        this.log('getServices() called.');

        var services = [];

        this.features.forEach((feature) => {
            services = services.concat(feature.getServices());
        });

        this.log(`A total of ${services.length} services found.`);

        return services;
    }

}
