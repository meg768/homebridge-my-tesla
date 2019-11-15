"use strict";

BETTERINIT

var Homebridge = require('./src/homebridge.js');

module.exports = function(homebridge) {

    Homebridge.Service = homebridge.hap.Service;
    Homebridge.Characteristic = homebridge.hap.Characteristic;
    Homebridge.Accessory = homebridge.hap.Accessory;
    Homebridge.PlatformAccessory = homebridge.platformAccessory;
    Homebridge.api = homebridge;
    Homebridge.uuid = homebridge.hap.uuid;

    homebridge.registerPlatform('homebridge-my-tesla', 'Tesla', require('./src/platform.js'));
};
