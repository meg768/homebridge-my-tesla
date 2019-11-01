"use strict";

var isString = require('yow/isString');
var Service  = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var Events = require('events');

module.exports = class Accessory extends Events {

    constructor(options) {
        var {vehicle, name} = options;

        if (!vehicle) 
            throw new Error('A vehicle must be specified.');

        if (!isString(name)) 
            throw new Error('An accessory name must be specified.');

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

    addServices() {
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
