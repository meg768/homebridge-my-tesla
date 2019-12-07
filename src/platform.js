"use strict";

module.exports = class Platform {

    constructor(log, config, homebridge) {

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.vehicles = [];
        this.debug = config.debug ? log : () => {};

        if (process.env.PUSHOVER_USER == undefined || process.env.PUSHOVER_TOKEN == undefined) {
    		this.log('Environment variables PUSHOVER_USER and/or PUSHOVER_TOKEN not defined. Push notifications will not be able to be sent.');
        }

        this.homebridge.on('didFinishLaunching', () => {
            this.debug('Finished launching.');
        });
        
    }

    accessories(callback) {
        
        var Vehicle = require('./vehicle.js');
        var vehicles = [];
        var accessories = [];

        this.debug(`Creating accessories...`);
        this.config.vehicles.forEach((config, index) => {
            console.log('*************');
            console.log(config);
            console.log('*************');
            vehicles.push(new Vehicle(this, config));
        });

        var promise = Promise.resolve();

        vehicles.forEach((vehicle) => {
            promise = promise.then(() => {
                return vehicle.getAccessories();                
            })
            .then((vehicleAccessories) => {
                accessories = accessories.concat(vehicleAccessories);
            })
        });

        promise.then(() => {
            this.vehicles = vehicles;
            callback(accessories);
        })
        .catch((error) => {
            this.log(error);
            callback([]);
        })
    }


    pushover() {
        var util = require('util');
        var message = util.format(...arguments);

    	var user  = process.env.PUSHOVER_USER;
    	var token = process.env.PUSHOVER_TOKEN;

    	if (user && token) {
			try {
                var payload = {priority:0, message:message};

                if (payload.message && payload.message.length > 0) {
                    var Pushover = require('pushover-notifications');
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
        else {
            this.log('Pushover credentials not specified.');

        }

    };

    generateUUID(id) {
        return this.homebridge.hap.uuid.generate(id.toString());
    }

}
