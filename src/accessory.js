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

        this.services = [];

        var service = new Service.AccessoryInformation();
        service.getCharacteristic(Characteristic.FirmwareRevision, "9.0");
        this.addService(service); 

        // Seems like we have to give it a name...
        this.name = name;
        this.displayName = name;
        this.UUID = uuid;
    }

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }
    
    addService(service) {
        this.services.push(service);
    }

    enableCharacteristic(service, characteristic, getter, setter) {

        service = this.getService(service);
        
        if (typeof getter === 'function') {
            service.getCharacteristic(characteristic).on('get', callback => {
                callback(null, getter());
            });
        }

        if (typeof setter === 'function') {
            service.getCharacteristic(characteristic).on('set', (value, callback) => {
                var response = setter(value);

                if (response instanceof Promise) {
                    response.then(() => {
                    })
                    .catch((error) => {
                        this.log(error);
                    })
                    .then(() => {
                        callback(null);                        
                    });
                }
                else
                    callback(null);
            });
    
        }

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

 
    }
};

module.exports = VehicleAccessory;