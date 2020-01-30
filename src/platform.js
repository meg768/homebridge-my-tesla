"use strict";

module.exports = class Platform {

    constructor(log, config, homebridge) {

        this.config = config;
        this.log = log;
        this.homebridge = homebridge;
        this.vehicles = [];
        this.debug = config.debug ? log : () => {};

        this.homebridge.on('didFinishLaunching', () => {
            this.debug('Finished launching.');
        });
        
    }

    accessories(callback) {
        
        var Vehicle = require('./vehicle.js');
        var vehicles = [];
        var accessories = [];

        this.debug(`Creating accessories...`);
        this.config.vehicles.forEach((config, index) => {
            vehicles.push(new Vehicle(this, config));
        });

        var promise = Promise.resolve();

        vehicles.forEach((vehicle) => {
            promise = promise.then(() => {
                return vehicle.getAccessories();                
            })
            .then((vehicleAccessories) => {
                accessories = accessories.concat(vehicleAccessories);
            })
        });

        promise.then(() => {
            this.vehicles = vehicles;
            callback(accessories);
        })
        .catch((error) => {
            this.log(error);
            callback([]);
        })
    }


    generateUUID(id) {
        return this.homebridge.hap.uuid.generate(id.toString());
    }

}
