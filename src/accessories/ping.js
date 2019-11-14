
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var merge = require('yow/merge');

module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5,
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});


        this.isActive               = false;
        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.enableSwitch();

        this.vehicle.on('vehicleData', (vehicleData) => {
            // Update switch state
            this.updateSwitch(vehicleData);
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.isActive) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
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
                this.log(`Battery level too low for ping to be enabled. Turning off.`);
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
        this.debug('Ping!');
        this.vehicle.getVehicleData();     
    }

    setActiveState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            if (this.isActive == value) {
                resolve();
            }
            else {
                this.isActive = value;

                this.debug(`Changing ping state to "${this.isActive}".`);

                if (this.isActive)
                    this.ping();
                
                resolve();    
            }
    
        })
    }



}

