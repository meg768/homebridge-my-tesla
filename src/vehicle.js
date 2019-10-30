"use strict";

var Events = require('events');
var API = require('./tesla-api.js');

var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var TemperatureSensor = require('./temperature-service.js');
var ChargingService = require('./charging-service.js');
var VehicleData = require('./vehicle-data.js');
var FreezeSensor = require('./freeze-sensor.js');

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

        this.features.push(new DoorLockService({vehicle:this, name:'DörrenX'}));
        this.features.push(new BatteryLevelService({vehicle:this, name:'BatteriX'}));
        this.features.push(new AirConditionerService({vehicle:this, name:'FläktenX'}));
        this.features.push(new TemperatureSensor({vehicle:this, name:'TemperaturX'}));
        this.features.push(new ChargingService({vehicle:this, name:'LaddningX'}));
        this.features.push(new FreezeSensor({vehicle:this, name:'FrostvaktX'}));

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
