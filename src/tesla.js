"use strict";

var Events   = require('events');
var isString = require('yow/is').isString;
var isObject = require('yow/is').isObject;
var isArray = require('yow/is').isArray;
var sprintf  = require('yow/sprintf');

var Request = require('yow/request');
var Timer   = require('yow/timer');

var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

const OFF = true;
const ON = false;



module.exports = class Tesla extends Events  {

    constructor(platform, config) {

        super();

        this.log = platform.log;
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.uuid = platform.generateUUID(config.vin);
        this.services = {};

        this.enableDoors();

    }

    enableDoors() {
        this.services.doors = new Service.Switch("Dörrar");


        var characteristic = this.services.doors.getCharacteristic(Characteristic.On);
        var state = false;

        characteristic.on('get', (callback) => {
            callback(null, state);
        });

        characteristic.on('set', (value, callback, context) => {

            state = value;
            characteristic.updateValue(state);

            this.log(value);
            callback();
        });

    }


    getServices() {

        const service = new Service.AccessoryInformation();

        service.setCharacteristic(Characteristic.Manufacturer, 'meg768');
        service.setCharacteristic(Characteristic.Model, 'Tesla');
        service.setCharacteristic(Characteristic.SerialNumber, '1.0');

        console.log('KALLE');
        return [service, this.services.doors];
    }

}
