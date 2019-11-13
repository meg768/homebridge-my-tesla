var TeslaAPI = require('./tesla-api.js');
var merge = require('yow/merge');

var DoorLockAccessory = require('./accessories/door-lock.js');
var ChargingAccessory = require('./accessories/charging.js');
var AirConditioningAccessory = require('./accessories/hvac.js');
var TemperatureAccessory = require('./accessories/temperature.js');
var DefrostAccessory = require('./accessories/defrost.js');
var PingAccessory = require('./accessories/ping.js');
var ThermostatAccessory = require('./accessories/thermostat.js');


module.exports = class Vehicle extends TeslaAPI  {

    constructor(platform, config) {

        var defaultConfig = {
            features: {
                ping: {
                    name: 'Ping'
                },
                doors: {
                    name: 'Door'
                },
                charging: {
                    name: 'Charging'
                },
                hvac: {
                    name: 'Air Conditioner'
                },
                temperature: {
                    name: 'Temperature'
                },
                thermostat: {
                    name: 'Thermostat'
                }    
            }
        };
        

        super({log:platform.log, debug:platform.debug, vin:config.vin});

        this.pushover = platform.pushover;
        this.config = merge({}, defaultConfig, config);
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;

        this.addFeature(DoorLockAccessory, 'doors');
        this.addFeature(ChargingAccessory, 'charging');
        this.addFeature(AirConditioningAccessory, 'hvac');
        this.addFeature(PingAccessory, 'ping');
        this.addFeature(TemperatureAccessory, 'temperature');
        this.addFeature(ThermostatAccessory, 'thermostat');
        
        var configLoginOptions = {username:config.username, password:config.password, clientID:config.clientID, clientSecret:config.clientSecret};
        var processLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...processLoginOptions};

        this.debug(loginOptions);

        this.login(loginOptions).then(() => {
            this.debug('Login completed.');
            return Promise.resolve();
        })
        .then(() => {
            return this.getVehicleData();
        })
        .then((vehicleData) => {
            this.debug(`${JSON.stringify(vehicleData.json, null, "  ")}`);
        })
        .catch((error) => {
            this.log(error);
        });


    }

    addFeature(fn, name) {
        var feature = this.config.features[name];

        if (feature != undefined) {
            if (feature.enabled == undefined || feature.enabled) {
                this.addAccessory(new fn({vehicle:this, config:feature}));
            }
        }

    }
    

    addAccessory(accessory) {
        this.accessories.push(accessory);
        this.platform.addAccessory(accessory);
    }

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }


}
