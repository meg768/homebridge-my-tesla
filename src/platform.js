"use strict";

var Homebridge = require('./homebridge.js');
var Accessory  = require('./homebridge.js').Accessory;
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var TeslaAPI = require('./tesla-api.js');

class Switch extends Accessory {

    constructor(options) {
        var {platform, api} = options;
        super('DisplayName', Homebridge.generateUUID('FOO'));
        console.log(this);
        this.state = 0;
        this.api = api;
        this.platform = platform;

        this.addService(Service.Switch);

        
        var service = this.getService(Service.Switch);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.state);
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            callback(null, this.state = value);
        });

    }

}
module.exports = class Platform {

    constructor(log, config, homebridge) {

        log(config);

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.accessoryArray = [];
        this.debug = config.debug ? log : () => {};
        this.api = new TeslaAPI({vin:'5YJ3E7EB9KF240654'});


        if (process.env.PUSHOVER_USER == undefined || process.env.PUSHOVER_TOKEN == undefined) {
    		this.log('Environment variables PUSHOVER_USER and/or PUSHOVER_TOKEN not defined. Push notifications will not be able to be sent.');
        }

        this.addAccessory(new Switch({platform:this, api:this.api}));
    
        this.api.login().then(() => {
            this.log('Login completed.');
            return Promise.resolve();
        })
        

/*
        this.config.vehicles.forEach((config, index) => {
            this.vehicles.push(new Vehicle(this, config));
        });
  */      

    }

    pushover(payload) {

        var Pushover = require('pushover-notifications');
    	var user     = process.env.PUSHOVER_USER;
    	var token    = process.env.PUSHOVER_TOKEN;

    	if (user && token) {
			try {
                payload = Object.assign({priority:0}, payload);

                if (payload.message && payload.message.length > 0) {
    				var push = new Pushover({user:user, token:token});

    				push.send(payload, function(error, result) {
    					if (error) {
    						this.log(error.stack);
    					}
    				});

                }
			}
			catch(error) {
				this.log('Failed to send Pushover notification.', error.message);
    		};

    	}

    };

    addAccessory(accessory) {
        console.log('Adding to accessory arrayt');
        this.accessoryArray.push(accessory);

    }

    accessories() {
        console.log('::::::::::::::::::::: accessories called', this.accessoryArray.length);
        return this.accessoryArray;
    }

    generateUUID(id) {
        return this.homebridge.hap.uuid.generate(id.toString());
    }


}
