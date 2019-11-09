
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var isArray = require('yow/isArray');
var isNumber = require('yow/isNumber');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var defaultConfig = {
            requiredBatteryLevel   : 40,
            pingInterval           : 1,
        };

        var config = {...defaultConfig, ...this.config};

        this.isActive               = false;
        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.pingInterval           = config.pingInterval * 60000;

        this.enableSwitch();

        this.vehicle.on('vehicleData', (vehicleData) => {
            // Update switch state
            this.updateSwitch(vehicleData);
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {
            this.debug('Response from Tesla API - resetting ping timer.');

            // Whenever we get a response, reset the timer
            if (this.isActive)
                this.timer.setTimer(this.pingInterval, this.ping.bind(this));
            else
                this.timer.cancel();

        });

    }

    enableSwitch() {
        var service = new Service.Switch(this.name, __filename);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isActive);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setActiveState(value).then(() => {
                callback(null, this.isActive);
            })
            .catch((error) => {
                callback(null);
            })
        });
    }

    updateSwitch(vehicleData) {

        Promise.resolve().then(() => {
            if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                this.debug(`Battery level too low for ping to be enabled. Turning off.`);
                return this.setActiveState(false);
            }
            else
                return Promise.resolve();
     
        })
        .then(() => {
            this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.isActive);

        })
    }

    ping() {
        if (this.isActive) {
            this.debug('Ping!');
            return this.vehicle.getVehicleData();     
        }
    }

    setActiveState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            if (this.isActive == value) {
                resolve();
            }
            else {
                this.isActive = value;

                this.debug(`Changing ping state to "${value}".`);
                this.Ping();
                
                resolve();    
            }
    
        })
    }



}

