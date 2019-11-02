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
            category = homebridge.hap.Accessory.OTHER;

        console.log(`Created new Accessory with name ${name}, uuid ${uuid} and category ${category}`);

        super(name, uuid, category);

        // Seems like we have to giv it a name...
        this.name = name;
    }


    // Add the method getServices for static platforms
    getServices() {
        return this.services;
    }
};

/*
module.exports = class Accessory extends Events {

    constructor(options) {
        var {vehicle, name} = options;

        super();

        this.name = name;
        this.vehicle = vehicle;
        this.platform = this.vehicle.platform;
        this.debug = this.platform.debug;
        this.log = this.platform.log;
        this.api = this.vehicle.api;
        this.services = [];
    }

    addService(service) {
        this.services.push(service);
    }

    getServices() {
        return this.services;
    }

    addAccessoryInformation(options) {
        var service = new Service.AccessoryInformation();

        var {manufacturer, model, firmwareVersion, serialNumber} = options;

        if (manufacturer)
            service.setCharacteristic(Characteristic.Manufacturer, manufacturer);

        if (model)
            service.setCharacteristic(Characteristic.Model, model);

        if (firmwareVersion)
            service.setCharacteristic(Characteristic.FirmwareRevision, firmwareVersion);

        if (serialNumber)
            service.setCharacteristic(Characteristic.SerialNumber, serialNumber);

        this.addService(service);
    }

    identify(callback) {
        callback();
    }

};

*/