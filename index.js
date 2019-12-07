"use strict";

var Homebridge = require('./src/homebridge.js');
var Path = require('path');
var isString = require('yow/isString');

module.exports = function(homebridge) {

    Homebridge.Service = homebridge.hap.Service;
    Homebridge.Characteristic = homebridge.hap.Characteristic;
    Homebridge.Accessory = homebridge.hap.Accessory;
    Homebridge.PlatformAccessory = homebridge.platformAccessory;
    Homebridge.api = homebridge;
    Homebridge.uuid = homebridge.hap.uuid;

    // Load .env
    /*
    if (isString(process.env.HOME)) {
        require('dotenv').config({path: Path.join(process.env.HOME, '.homebridge/.env')});
    }
    */

    homebridge.registerPlatform('homebridge-my-tesla', 'Tesla', require('./src/platform.js'));
};
