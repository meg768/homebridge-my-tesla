"use strict";

var Path = require('path');
var Events = require('events');
var Tesla = require('./tesla.js');
var API = require('./api.js');

var sprintf = require('yow/sprintf');
var isString = require('yow/is').isString;



module.exports = class Platform {

    constructor(log, config, homebridge) {

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.teslas = [];
        this.api = new API({log:log});

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

        this.api.login().then(() => {
            this.teslas.forEach((tesla, index) => {
                tesla.emit('ready');
            });
        
        })
        .catch((error) => {
            this.log(JSON.stringify(error));
            process.exit(1);

        })
        

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
