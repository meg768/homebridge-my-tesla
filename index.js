// Load .env
require('dotenv').config();


module.exports = function(homebridge) {

    var Homebridge = require('./src/homebridge.js');

    Object.assign(Homebridge, {
        Service        : homebridge.hap.Service,
        Characteristic : homebridge.hap.Characteristic,
//        Accessory      : homebridge.hap.Accessory,
        Accessory      : homebridge.platformAccessory,
        generateUUID   : homebridge.hap.uuid.generate
    });

    homebridge.registerPlatform('homebridge-my-tesla', 'Tesla', require('./src/platform.js'));
};
