
var Service = require('../homebridge.js').Service;
var Characteristic = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Fan = require('./fan.js');

module.exports = class extends Fan {

    constructor(options) {
        var config = {
            "name": "Fan"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicleData', (vehicleData) => {    
            var isClimateOn = vehicleData.climateState.isClimateOn();
            this.debug(`Updated HVAC status to ${isClimateOn ? 'ON' : 'OFF'}.`);
            this.updateFanState(isClimateOn);
        });

    }

    turnOn() {
        return this.vehicle.autoConditioningStart();
    }

    turnOff() {
        return this.vehicle.autoConditioningStop();
    }


}


