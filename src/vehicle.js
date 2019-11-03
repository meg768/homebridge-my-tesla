"use strict";

var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
//var Accessory = require('./homebridge.js').Accessory;
var Accessory = require('./accessory.js');
var PlatformAccessory = require('./homebridge.js').PlatformAccessory;
var VehicleData = require('./vehicle-data.js');

var Events = require('events');
var API = require('./tesla-api.js');
/*
var BatteryLevelService = require('./battery-level-service.js')
var AirConditionerService = require('./hvac-service.js');
var DoorLockService = require('./door-lock-service.js');
var TemperatureSensor = require('./temperature-service.js');
var ChargingService = require('./charging-service.js');
var AntiFreezeService = require('./anti-freeze-service.js');
*/
var VehicleData = require('./vehicle-data.js');



module.exports = class Tesla extends Events  {

    constructor(platform, config) {

        super();

        this.log = platform.log;
        this.debug = platform.debug;
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.api = new API({log:this.log, debug:this.debug, vin:config.vin});
        this.platform = platform;


        var DoorLockAccessory = require('./accessories/door-lock.js');
        var ChargingAccessory = require('./accessories/charging.js');
        var AirConditioningAccessory = require('./accessories/hvac.js');
        var TemperatureAccessory = require('./accessories/temperature.js');

        if (this.config.locks)
            this.addAccessory(new DoorLockAccessory({vehicle:this, config:this.config.locks}));

        if (this.config.charging)
            this.addAccessory(new ChargingAccessory({vehicle:this, config:this.config.charging}));

        if (this.config.hvac)
            this.addAccessory(new AirConditioningAccessory({vehicle:this, config:this.config.hvac}));

        if (this.config.temperature)
            this.addAccessory(new TemperatureAccessory({vehicle:this, config:this.config.temperature}));

        var configLoginOptions = {username:config.username, password:config.password, clientID:config.clientID, clientSecret:config.clientSecret};
        var envLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...envLoginOptions};
        
        this.api.login(loginOptions).then(() => {
            this.log('Login completed.');

    
            return Promise.resolve();
        })
        .then(() => {

            return Promise.resolve();

        })
        .then(() => {
            return this.refresh();

            var loop = () => {
                this.refresh().then(() => {
                })
                .catch((error) => {
                    this.log(error);
                })
                .then(() => {
                    setTimeout(loop.bind(this), 5 * 60 * 1000);
                });
            };
    
            loop();
        })
        .catch((error) => {
            this.log(error);
        });


    }

    addAccessory(accessory) {
        this.accessories.push(accessory);
        this.platform.addAccessory(accessory);
    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    refresh() {
        return new Promise((resolve, reject) => {
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

                this.accessories.forEach((accessory) => {
                    accessory.emit('vehicleData', data);
                });

                this.log('Refreshed features...');

                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    
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
