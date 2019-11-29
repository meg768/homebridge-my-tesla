
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class Fan extends Accessory {

    constructor(options) {

        super(options);
 
        this.fanState = false;
        
        this.addService(new Service.Fan(this.name));
        this.enableCharacteristic(Service.Fan, Characteristic.On, this.getFanState.bind(this), this.setFanState.bind(this));
    }

    updateFanState(value) {
        var service = this.getService(Service.Fan);

        var updateValue = () => {
            service.getCharacteristic(Characteristic.On).updateValue(this.getFanState());
            return Promise.resolve();
        };

        if (value == undefined) {
            return updateValue();
        }
        return new Promise((resolve, reject) => {
            this.setFanState(value).then(() => {
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

    getFanState() {
        return this.fanState;
    }

    setFanState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.fanState == value)
                    return Promise.resolve();

                this.fanState = value;
                this.debug(`Setting fan "${this.name}" state to "${this.fanState}".`);
                return this.fanState ? this.turnOn() : this.turnOff();
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

