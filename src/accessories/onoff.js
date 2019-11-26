
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

class On extends Characteristic.On {
    constructor(options) {

        var {service} = options;

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setOnOffState(value).then(() => {
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                callback();
            })
        });

    }
}
module.exports = class OnOff extends Accessory {

    constructor(options) {

        var {service, ...options} = options;

        super(options);
 
        this.onOffState = false;
        this.service = new serviceConstructor(this.name);

        if (serviceConstructor == undefined) {
            throw new Error(`A service constructor must be defined.`);
        }

        this.addService(this.service);

        this.service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setOnOffState(value).then(() => {
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                callback();
            })
        });

        this.service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getSwitchState());
        });
    }

    updateOnOffState(value) {

        var updateValue = () => {
            this.service.getCharacteristic(Characteristic.On).updateValue(this.getSwitchState());
            return Promise.resolve();
        };

        if (value == undefined) {
            return updateValue();
        }
        return new Promise((resolve, reject) => {
            this.setOnOffState(value).then(() => {
                return updateValue();
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            })
        });
    }

    getSwitchState() {
        return this.switchState;
    }

    setSwitchState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.switchState == value)
                    return Promise.resolve();

                this.switchState = value;
                this.debug(`Setting switch "${this.name}" state to "${this.switchState}".`);
                return this.switchState ? this.turnOn() : this.turnOff();
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            })
        });
    }

    turnOn() {
        return Promise.resolve();
    }

    turnOff() {
        return Promise.resolve();
    }

}

