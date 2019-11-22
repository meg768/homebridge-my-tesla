
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');



module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.pingState              = false;

        this.addService(new Service.Switch(this.name));
        this.enableOn();


    }

    enableOn() {
        var service = this.getService(Service.Switch);

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.pingState = value ? true : false;

            if (this.pingState) {
                var timer = new Timer();
                timer.setTimer(2000, () => {
                    this.pingState = false;
                    service.getCharacteristic(Characteristic.On).updateValue(this.pingState);
                });
            }
            callback();
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.pingState);
        });


    }



}



/*

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

        this.pingState              = false;
        this.requiredBatteryLevel   = 90; //config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.addService(new Service.Switch(this.name));
        this.enableOn();

        this.vehicle.on('vehicleData', (vehicleData) => {

            this.debug(`Checking battery level. Current level is ${vehicleData.getBatteryLevel()}%, must be above ${this.requiredBatteryLevel}%.`);

            if (this.getPingState() && (vehicleData.getBatteryLevel() < this.requiredBatteryLevel)) {
                this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
                this.setPingState(false).then(() => {
                    return this.updatePingState();
                })
                .catch((error) => {
                    this.log(error);
                })
            }
            else {
                this.debug(`Checking battery level. OK!`);
            }

        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getPingState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

    }

    enableOn() {
        var service = this.getService(Service.Switch);

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setPingState(value).then(() => {
                callback();
            })
            .catch((error) => {
                callback(error);
            })
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.pingState);
        });

        service.getCharacteristic(Characteristic.On).on('change', (params) => {
            //this.debug(`Ping state changed to "${JSON.stringify(params)}. Current ping state is ${this.getPingState()}."!!!!!!`);
            //service.getCharacteristic(Characteristic.On).updateValue(this.getPingState());
        });

    }

    updatePingState() {
        this.debug(`Updating ping state to "${this.pingState}".`);
        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.pingState);
        return Promise.resolve();
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




*/