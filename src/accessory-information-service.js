
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.AccessoryInformation {

    constructor() {
        super();

        this.setCharacteristic(Characteristic.Manufacturer, 'meg768');
        this.setCharacteristic(Characteristic.Model, 'Tesla Homebridge');
        this.setCharacteristic(Characteristic.SerialNumber, '2.0');
    
    }
}; 

