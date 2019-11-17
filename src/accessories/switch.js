
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.state = undefined;

        var service = new Service.Switch(this.name, __filename);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.state);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setState(value).then(() => {
                callback(null, this.state);
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })
        });

    }

    updateState(value) {
        var service = this.getService(Service.Switch);
        this.state = value ? true : false;

        this.debug(`Updated switch "${this.name}" state to ${this.switchState ? 'ON' : 'OFF'}.`);        
        service.getCharacteristic(Characteristic.On).updateValue(this.switchState);

    }

    getState() {
        return this.state;
    }

    setState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            if (value === this.state) {
            }
            else {
                this.debug(`Setting switch "${this.name}" state to "${value}".`);
                this.state = value;
                this.emit('stateChanged');
            }
            resolve();    
        })
    }

}

