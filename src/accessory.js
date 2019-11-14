var homebridge = require('./homebridge.js').api;
var {Service, Characteristic} = require('./homebridge.js');

var Events = require('events');

// Basic accessory - may be used for most projects
class Accessory extends Events {

    constructor(options) {
        super();

        var {name, uuid, category} = options;

        if (name == undefined)
            throw new Error('A name of the accessory must be specified.');

        if (uuid == undefined)
            uuid = homebridge.hap.uuid.generate(name);

        if (category == undefined)
            category = homebridge.hap.Accessory.Categories.OTHER;

  
        if (name == undefined)
            throw new Error('A name of the accessory must be specified.');

        if (uuid == undefined)
            uuid = homebridge.hap.uuid.generate(name);

        if (category == undefined)
            category = homebridge.hap.Accessory.Categories.OTHER;

        console.log(`Created new Accessory with name ${name}, uuid ${uuid} and category ${category}`);

        this.services = [];

        var service = new Service.AccessoryInformation();

        service.setCharacteristic(Characteristic.Name, this.name);
        service.setCharacteristic(Characteristic.Manufacturer, "meg768879876");
        service.setCharacteristic(Characteristic.Model, "S3XY");
        service.setCharacteristic(Characteristic.SerialNumber, "123-456-789");
        service.setCharacteristic(Characteristic.FirmwareRevision, "1.0");

        this.addService(service); 

        // Seems like we have to give it a name...
        this.name = name;
        this.displayName = name;
        this.UUID = uuid;
    }

    addService(service) {
        this.services.push(service);
    }

    getService(name) {
        for (var index in this.services) {
            var service = this.services[index];
            
            if (typeof name === 'string' && (service.displayName === name || service.name === name))
                return service;
            else if (typeof name === 'function' && ((service instanceof name) || (name.UUID === service.UUID)))
                return service;
          }
        
    }
    // Add the method getServices for static platforms
    getServices() {
        return this.services;
    }
};


class VehicleAccessory extends Accessory {

    constructor(options) {
        var {vehicle, config, ...options} = options;

        if (vehicle == undefined)
            throw new Error('A vehicle must be specified');

        if (config == undefined)
            throw new Error('A configuration must be specified');

        if (config.name == undefined)
            throw new Error('An accessory name must be specified');

        super({name:config.name});

        this.config = config || {};
        this.vehicle = vehicle;
        this.log = vehicle.log;
        this.debug = vehicle.debug;
        this.platform = vehicle.platform;

        this.vehicle.once('vehicleData', (vehicleData) => {
            this.log(`Accessory "${this.name}" logged in...`)
            var service = this.getService(Service.AccessoryInformation);
            service.setCharacteristic(Characteristic.Name, this.name);
            service.setCharacteristic(Characteristic.Manufacturer, "meg768879876");
            service.setCharacteristic(Characteristic.Model, "S3XYXXX");
            service.setCharacteristic(Characteristic.SerialNumber, `VIN ${vehicleData.json.vin}`);
            service.setCharacteristic(Characteristic.FirmwareRevision, "1.0");
        });
    }

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }
    

};

module.exports = VehicleAccessory;