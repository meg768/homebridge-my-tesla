"use strict";

var Service  = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var Events   = require('events');
var random =  require('yow/random');

module.exports = class Accessory extends Events {

    constructor(tesla) {

        super();

        this.tesla = tesla;
        this.platform = this.tesla.platform;
        this.debug = this.platform.debug;
        this.log = this.platform.log;
        this.api = this.tesla.api;
        this.services = [];

        this.addAccessoryInformation();
    }

    addService(service) {
        this.services.push(service);
    }

    getServices() {
        return this.services;
    }

    addAccessoryInformation() {
        var service = new Service.AccessoryInformation();

        var manufacturer = this.getManufacturer();
        var model = this.getModel();
        var firmwareVersion = this.getFirmwareVersion();
        var serialNumber = this.getSerialNumber();

        if (manufacturer)
            service.setCharacteristic(Characteristic.Manufacturer, manufacturer);

        if (model)
            service.setCharacteristic(Characteristic.Model, model);

        if (firmwareVersion)
            service.setCharacteristic(Characteristic.FirmwareRevision, firmwareVersion);

        if (serialNumber)
            service.setCharacteristic(Characteristic.SerialNumber, serialNumber);


        //this.addService(service);
    }

    identify(callback) {
        this.log('Identify called for accessory', this.name);
        callback();
    }

    getManufacturer() {
        return 'meg768';
    }

    getModel() {
        return 'model';
    }

    getFirmwareVersion() {
        return '1.0';
    }

    getSerialNumber() {
        return '11-111-11';
    }




};
