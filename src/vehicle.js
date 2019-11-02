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
        this.uuid = platform.generateUUID(config.vin);
        this.api = new API({log:this.log, debug:this.debug, vin:config.vin});
        this.platform = platform;


        var DoorLockAccessory = require('./door-lock-accessory.js');

        var accessory = new DoorLockAccessory({vehicle:this, name:'Dörren'});
        this.platform.addAccessory(accessory);
/*
        var state = 0;
        var accessory = new Accessory({name:'A'}); // , this.platform.generateUUID('B'));
        var service = new Service.Switch('Knapp C', 'Knapp D');
        console.log(accessory);
        accessory.addService(service);

        this.platform.addAccessory(accessory);

        accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).on('get', (callback) => {
            console.log('GETTING');
            callback(null, state);
        });
        accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            console.log('SETTING');
            state = value;
            callback(null, value);
        });
*/
        this.api.login().then(() => {
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
    /*
                this.features.forEach((feature) => {
                    feature.emit('refresh', data);
                });
    */
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
