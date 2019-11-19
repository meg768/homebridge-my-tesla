
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

        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.addSwitchService();

        this.vehicle.on('vehicleData', (vehicleData) => {

            Promise.resolve().then(() => {
                if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                    this.log(`Battery level too low for ping to be enabled. Turning off.`);
                    return this.setSwitchState(false);
                }
                else   
                    return Promise.resolve();
    
            })
            .then(() => {
                return this.updateSwitchState();
            })
            .catch((error) => {
                this.log(error);
            });
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getSwitchState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

    }

    addSwitchService() {
        var service = new Service.Switch(this.name);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getSwitchState());
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setSwitchState(value).then(() => {
                callback(null, this.getSwitchState());
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })
        });
    }

    getSwitchState() {
        return this.switchState;
    }

    updateSwitchState(value) {
        var service = this.getService(Service.Switch);

        if (value != undefined) {
            value = value ? true : false;
         
            if (value !== this.state) {
                this.switchState = value;
                this.debug(`Updated switch "${this.name}" state to ${this.switchState ? 'ON' : 'OFF'}.`);        
            }
        }

        service.getCharacteristic(Characteristic.On).updateValue(this.switchState);
        return Promise.resolve();
    }

    setSwitchState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            Promise.resolve().then(() => {
                if (this.getSwitchState() === value) {
                }
                else {
                    this.debug(`Setting switch "${this.name}" state to "${value}".`);
                    this.switchState = value;
                }
                return Promise.resolve();
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    
        })
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
    }


}

