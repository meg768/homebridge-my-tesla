var TeslaAPI = require('./tesla-api.js');

module.exports = class Vehicle extends TeslaAPI  {

    constructor(platform, config) {

        super({log:platform.log, debug:platform.debug, vin:config.vin});

        this.log = platform.log;
        this.debug = platform.debug;
        this.pushover = platform.pushover;
        this.config = config;
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

        if (this.config.ping && this.config.ping.enabled)
            this.addAccessory(new PingAccessory({vehicle:this, config:this.config.ping}));
        
        var configLoginOptions = {username:config.username, password:config.password, clientID:config.clientID, clientSecret:config.clientSecret};
        var processLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...processLoginOptions};

        this.debug(loginOptions);

        this.login(loginOptions).then(() => {
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
