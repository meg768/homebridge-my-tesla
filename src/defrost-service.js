
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "defrost");

        this.enabled = false;
        this.tesla = tesla;

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.enabled);    
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            callback(null, this.state = value);
    
        });
    
    
    
    
    }
}; 

