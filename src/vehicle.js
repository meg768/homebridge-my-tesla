var TeslaAPI = require('./tesla-api.js');
var merge = require('yow/merge');


module.exports = class Vehicle extends TeslaAPI  {

    constructor(platform, config) {

        var defaultConfig = {
            ping: {
                name: 'Ping'
            },
            locks: {
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
        };
        

        super({log:platform.log, debug:platform.debug, vin:config.vin});

        this.pushover = platform.pushover;
        this.config = merge({}, defaultConfig, config);
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;

        var DoorLockAccessory = require('./accessories/door-lock.js');
        var ChargingAccessory = require('./accessories/charging.js');
        var AirConditioningAccessory = require('./accessories/hvac.js');
        var TemperatureAccessory = require('./accessories/temperature.js');
        var DefrostAccessory = require('./accessories/defrost.js');
        var PingAccessory = require('./accessories/ping.js');
        var ThermostatAccessory = require('./accessories/thermostat.js');

        this.addAccessory(new DoorLockAccessory({vehicle:this, config:this.config.locks}));
        this.addAccessory(new ChargingAccessory({vehicle:this, config:this.config.charging}));
        this.addAccessory(new AirConditioningAccessory({vehicle:this, config:this.config.hvac}));
        this.addAccessory(new TemperatureAccessory({vehicle:this, config:this.config.temperature}));
        this.addAccessory(new PingAccessory({vehicle:this, config:this.config.ping}));
        this.addAccessory(new ThermostatAccessory({vehicle:this, config:this.config.thermostat}));
        
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
