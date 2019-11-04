"use strict";

var Events = require('events');
var API = require('./tesla-api.js');
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
        var DefrostAccessory = require('./accessories/defrost.js');

        if (this.config.locks && this.config.locks.enabled)
            this.addAccessory(new DoorLockAccessory({vehicle:this, config:this.config.locks}));

        if (this.config.charging && this.config.charging.enabled)
            this.addAccessory(new ChargingAccessory({vehicle:this, config:this.config.charging}));

        if (this.config.hvac && this.config.hvac.enabled)
            this.addAccessory(new AirConditioningAccessory({vehicle:this, config:this.config.hvac}));

        if (this.config.temperature && this.config.temperature.enabled)
            this.addAccessory(new TemperatureAccessory({vehicle:this, config:this.config.temperature}));

        if (this.config.defrost && this.config.defrost.enabled)
            this.addAccessory(new DefrostAccessory({vehicle:this, config:this.config.defrost}));

        var configLoginOptions = {username:config.username, password:config.password, clientID:config.clientID, clientSecret:config.clientSecret};
        var processLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...processLoginOptions};

        this.debug(loginOptions);

        this.api.login(loginOptions).then(() => {
            this.log('Login completed.');
            return Promise.resolve();
        })
        .then(() => {
            return this.getVehicleData();
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

    getVehicleData() {
        return new Promise((resolve, reject) => {
            var vin = this.config.vin;

            this.debug(`Fetching vehicle data for vehicle ${vin}...`);
    
            Promise.resolve().then(() => {
                return this.api.getVehicleData();
            })
            .then((response) => {
                var data = new VehicleData(response);

                this.accessories.forEach((accessory) => {
                    accessory.emit('vehicleData', data);
                });

                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    
        });
    }

}
