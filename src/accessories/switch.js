
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');



module.exports = class Switch extends Accessory {

    constructor(options) {

        var {switchType = 'switch', ...options} = options;

        super(options);
 
        this.switchState = false;
        
        switch (switchType) {
            case 'fan': {
                this.switchService = new Service.Fan(this.name);
                break;
            }
            case 'switch': {
                this.switchService = new Service.Switch(this.name);
                break;
            }
            default: {
                throw new Error(`Invalid switch type "${switchType}".`);
            }
        }
 

        this.addService(this.switchService = new Service.Switch(this.name));
        this.addCharacteristic(this.switchService, Characteristic.On, this.getSwitchState.bind(this), this.setSwitchState.bind(this));
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

