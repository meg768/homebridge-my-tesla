"use strict";

var Vehicle = require('./vehicle.js');


module.exports = class Platform {

    constructor(log, config, homebridge) {

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.items = [];
        this.vehicles = [];
        this.debug = config.debug ? log : () => {};

        // Load .env
        require('dotenv').config();

        if (process.env.PUSHOVER_USER == undefined || process.env.PUSHOVER_TOKEN == undefined) {
    		this.log('Environment variables PUSHOVER_USER and/or PUSHOVER_TOKEN not defined. Push notifications will not be able to be sent.');
    	}

        this.homebridge.on('didFinishLaunching', () => {
            this.debug('Finished launching.');
        });
        
        this.config.vehicles.forEach((config, index) => {
            this.vehicles.push(new Vehicle(this, config));
        });

    }

    accessories(callback) {
        callback(this.items);
    }

    addAccessory(accessory) {
        this.items.push(accessory);
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

    generateUUID(id) {
        return this.homebridge.hap.uuid.generate(id.toString());
    }

}
