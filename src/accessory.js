"use strict";

var Service  = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var Events = require('events');

module.exports = class Accessory extends Events {

    constructor(tesla) {

        super();

        this.tesla = tesla;
        this.platform = this.tesla.platform;
        this.debug = this.platform.debug;
        this.log = this.platform.log;
        this.api = this.tesla.api;
        this.services = [];

        this.addAccessoryInformation({manufacturer:'Craft Foods', model:'HVAC', firmwareVersion:'1.0', serialNumber:'123-123'});

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
