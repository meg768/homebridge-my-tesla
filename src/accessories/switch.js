
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class Switch extends Accessory {

    constructor(options) {

        var {SwitchService = Service.Switch, ...options} = options;

        super(options);
        
        this.switchState = false;
        this.switchService = new SwitchService(this.name);

        this.addService(this.switchService);

        this.switchService.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setSwitchState(value).then(() => {
            })
            .catch((error) => {
                this.log(error);
            })
            .then(() => {
                callback();
            })
        });

        this.switchService.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.getSwitchState());
        });
    }

    updateSwitchState(value) {

        var updateValue = () => {
            this.switchService.getCharacteristic(Characteristic.On).updateValue(this.getSwitchState());
            return Promise.resolve();
        };

        if (value == undefined) {
            return updateValue();
        }
        return new Promise((resolve, reject) => {
            this.setSwitchState(value).then(() => {
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

