
var Service  = require('../../homebridge.js').Service;
var Characteristic  = require('../../homebridge.js').Characteristic;
var Accessory = require('../../accessory.js');


module.exports = class Switch extends Accessory {

    constructor(options) {

        super(options);
 
        this.switchState = false;
        
        this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getSwitchState.bind(this), this.setSwitchState.bind(this));
    }

    async updateSwitchState(value) {
        if (value != undefined)
            this.switchState = value;

        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.switchState);
    }

    getSwitchState() {
        return this.switchState;
    }

    async setSwitchState(value) {
        value = value ? true : false;


		if (this.switchState != value) {
			this.debug(`Setting switch "${this.name}" state to ${value}.`);

			this.switchState = value;
			this.switchState ? await this.turnOn() : await this.turnOff();

		}


    }

    async turnOn() {
    }

    async turnOff() {
    }

}


