"use strict";

var Homebridge = require('./src/homebridge.js');


module.exports = function(homebridge) {

    Homebridge.Service = homebridge.hap.Service;
    Homebridge.Characteristic = homebridge.hap.Characteristic;
    Homebridge.Accessory = homebridge.platformAccessory;

    homebridge.registerPlatform('homebridge-my-tesla', 'Tesla', require('./src/platform.js'), true);
};
