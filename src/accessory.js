var homebridge = require('./homebridge.js').api;

// Basic accessory - may be used for most projects
class Accessory extends homebridge.platformAccessory {

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



class VehicleAccessory extends Accessory {

    constructor(options) {
        var {vehicle, ...options} = options;

        if (vehicle == undefined)
            throw new Error('A vehicle must be specified');

        super(options);

        this.vehicle = vehicle;
        this.log = vehicle.log;
        this.debug = vehicle.debug;
        this.platform = vehicle.platform;
        this.api = vehicle.api;
    }

};

module.exports = VehicleAccessory;
