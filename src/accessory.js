"use strict";

var Events   = require('events');

module.exports = class Accessory extends Events {

    constructor(tesla) {

        super();

        this.tesla = tesla;
        this.platform = this.tesla.platform;
        this.debug = this.platform.debug;
        this.log = this.platform.log;
        this.api = this.tesla.api;
        this.services = [];
    }

    addService(service) {
        this.services.push(service);
    }
    getServices() {
        return this.services;
    }

};
