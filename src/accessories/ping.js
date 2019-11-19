
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');

class Switch extends Service.Switch {

    constructor(displayName, subtype) {

        super(displayName, subtype);

        this.value = undefined;

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getValue());
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setValue(value).then(() => {
                callback(null, this.getValue());
            })
            .catch((error) => {
                console.log(error);
                callback(null);
            })
        });
    }

    getValue() {
        return this.value;
    }

    updateValue() {
        this.getCharacteristic(Characteristic.On).updateValue(this.value);
        return Promise.resolve();
    }

    setValue(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            Promise.resolve().then(() => {
                if (this.getValue() === value) {
                }
                else {
                    this.debug(`Setting switch "${this.name}" state to "${value}".`);
                    this.value = value;
                    this.emit('valueChanged', this.getValue());
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

    
}







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

        this.switch = new Switch(this.name);

        this.addService(this.switch);

        this.switch.on('valueChanged', (value) => {
            if (value)
                this.ping();
        });

        this.vehicle.on('vehicleData', (vehicleData) => {

            Promise.resolve().then(() => {
                if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                    this.log(`Battery level too low for ping to be enabled. Turning off.`);
                    return this.switch.setValue(false);
                }
                else   
                    return Promise.resolve();
    
            })
            .then(() => {
                return this.switch.updateValue();
            })
            .catch((error) => {
                this.log(error);
            });
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.switch.getValue()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
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

        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.addSwitchService();

        this.on('switchStateChanged', (state) => {
            if (state)
                this.ping();
        });

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

    updateSwitchState() {
        var service = this.getService(Service.Switch);
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
                    this.emit('switchStateChanged', this.getSwitchState());
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

*/