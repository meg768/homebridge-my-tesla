"use strict";

var homebridge = require('./homebridge.js').api;
var PlatformAccessory = homebridge.platformAccessory;

module.exports = class Accessory extends PlatformAccessory {

    constructor(options) {
        var {name, uuid, category} = options;

        if (name == undefined)
            throw new Error('A name of the accessory must be specified.');

        if (uuid == undefined)
            uuid = homebridge.hap.uuid.generate(name);

        if (category == undefined)
            category = homebridge.hap.Accessory.Categories.OTHER;

        console.log(`Created new Accessory with name ${name}, uuid ${uuid} and category ${category}`);

        super(name, uuid, category);

        // Seems like we have to give it a name...
        this.name = name;
    }


    // Add the method getServices for static platforms
    getServices() {
        return this.services;
    }
};
