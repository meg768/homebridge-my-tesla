
var Service  = require('../../homebridge.js').Service;
var Characteristic  = require('../../homebridge.js').Characteristic;
var Accessory = require('../../accessory.js');

module.exports = class Fan extends Accessory {

    constructor(options) {

        super(options);
 
        this.fanState = false;
        
        this.addService(new Service.Fan(this.name));
        this.enableCharacteristic(Service.Fan, Characteristic.On, this.getFanState.bind(this), this.setFanState.bind(this));
    }

    updateFanState(value) {
        if (value != undefined)
            this.fanState = value;

        this.getService(Service.Fan).getCharacteristic(Characteristic.On).updateValue(this.fanState);
        return Promise.resolve();        
    }

    getFanState() {
        return this.fanState;
    }
	
    async setSwitchState(value) {
        value = value ? true : false;

		this.debug(`Setting switch "${this.name}" state to "${this.switchState}".`);

		if (this.switchState != value) {
			this.switchState = value;
			this.switchState ? await this.turnOn() : await this.turnOff();

		}


    }

    async setFanState(value) {
        value = value ? true : false;

		if (this.fanState != value) {
			this.fanState = value;
			this.debug(`Setting fan "${this.name}" state to "${this.fanState}".`);
			this.fanState ? await this.turnOn() : await this.turnOff();
		}
    }

    async turnOn() {
    }

    async turnOff() {
    }

}

