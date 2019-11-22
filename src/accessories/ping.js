
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');



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
        
        this.pingState = false;

        this.addService(new Service.Switch(this.name));

        this.enableOn();
        this.enableTimer();


    }

    enableTimer() {
        var timer = new Timer();
        var timerInterval = this.config.timerInterval * 60000;

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getPingState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                timer.setTimer(timerInterval, this.ping.bind(this));
            }
            else
                timer.cancel();

        });
    }

    enableOn() {
        var service = this.getService(Service.Switch);
        var requiredBatteryLevel = this.config.requiredBatteryLevel;

        this.vehicle.on('vehicleData', (vehicleData) => {

            if (this.getPingState() && (vehicleData.getBatteryLevel() < requiredBatteryLevel)) {
                this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
                this.setPingState(false).then(() => {
                    service.getCharacteristic(Characteristic.On).updateValue(this.getPingState());
                })
            }
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setPingState(value);
            callback();
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getPingState());
        });


    }



    getPingState() {
        return this.pingState;
    }

    setPingState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.pingState != value) {
                    this.pingState = value;
                    this.debug(`Setting ping state to "${this.pingState}".`);
                    return this.pingState ? this.ping() : Promise.resolve();
                }
                else {
                    return Promise.resolve();
                }
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                this.log(error);
                reject();
            })
        });
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
    }

}


