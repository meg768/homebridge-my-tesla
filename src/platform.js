"use strict";

var Path = require('path');
var Events = require('events');
var Tesla = require('./tesla.js');

var sprintf = require('yow/sprintf');
var isString = require('yow/is').isString;



module.exports = class Platform {

    constructor(log, config, homebridge) {

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.teslas = [];
        this.api = require('teslajs');
        this.token = undefined;
        this.vehicles = undefined;

        // Load .env
        require('dotenv').config({
            path: Path.join(process.env.HOME, '.homebridge/.env')
        });

        if (process.env.PUSHOVER_USER == undefined || process.env.PUSHOVER_TOKEN == undefined) {
    		this.log('Environment variables PUSHOVER_USER and/or PUSHOVER_TOKEN not defined. Push notifications will not be able to be sent.');
    	}

        this.config.teslas.forEach((config, index) => {
            this.teslas.push(new Tesla(this, config));
        });

        this.login().then((token) => {
            this.token = token;

            return this.getVehicles();
    
        })
        .then((response) => {
            this.log(response);
        })

        .then(() => {



        })


        .catch((error) => {
            this.log(JSON.stringify(error));
            process.exit(1);

        })
        

    }

    getVehicles() {
        return new Promise((resolve, reject) => {

            if (this.vehicles)
                resolve(this.vehicles);
            else {
                var options = {};
                options.authToken = this.token;
    
                this.api.vehicles(options, (error, response) => {
                    if (error)
                        reject(error);
                    else
                        resolve(response);
                });    
            }
        });
    }

 
    login() {
        return new Promise((resolve, reject) => {
            var tjs = require('teslajs');
 
            var username = process.env.TESLA_USER;
            var password = process.env.TESLA_PASSWORD;
        
            tjs.login(username, password, function(error, response) {
                if (error) {
                    reject(error);
                }
                else if (response.error) {
                    reject(new Error(response.error));
                }
                else if (response.authToken == undefined) {
                    reject(new Error('Cannot find an authToken.'));

                }
                else
                    resolve(response.authToken);
            });
    
        });
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


    debug() {
    }

    accessories(callback) {
        callback(this.teslas);

    }
}
