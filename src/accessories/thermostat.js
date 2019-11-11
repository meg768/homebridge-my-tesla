
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var isArray = require('yow/isArray');
var isNumber = require('yow/isNumber');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.maxTemperature = 30
        this.minTemperature = 0;

        this.currentTemperature = 20;
        this.targetTemperature = 20;

        this.heatingThresholdTemperature = 18;
        this.coolingThresholdTemperature = 21;

        //Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
        //Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
        this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

        // The value property of CurrentHeatingCoolingState must be one of the following:
        //Characteristic.CurrentHeatingCoolingState.OFF = 0;
        //Characteristic.CurrentHeatingCoolingState.HEAT = 1;
        //Characteristic.CurrentHeatingCoolingState.COOL = 2;
        this.currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;

        // The value property of TargetHeatingCoolingState must be one of the following:
        //Characteristic.TargetHeatingCoolingState.OFF = 0;
        //Characteristic.TargetHeatingCoolingState.HEAT = 1;
        //Characteristic.TargetHeatingCoolingState.COOL = 2;
        //Characteristic.TargetHeatingCoolingState.AUTO = 3;
        this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;

        this.addService(new Service.Thermostat(this.name, __filename));

        this.enableCurrentHeatingCoolingState();
        this.enableTargetHeatingCoolingState();
        this.enableCurrentTemperature();
        this.enableTargetTemperature();
        this.enableCoolingThresholdTemperature();
        this.enableHeatingThresholdTemperature();
        this.enableDisplayUnits();

        this.vehicle.on('vehicleData', (data) => {
            this.currentTemperature = data.getInsideTemperature();
            this.debug(`Updated inside temperature for thermostat to ${this.currentTemperature}.`);  

            var service = this.getService(Service.Thermostat);
            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
            this.updateCurrentHeatingCoolingState();
        });


    }
    



    enableCurrentHeatingCoolingState() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState);

        characteristic.on('get', callback => {
            callback(null, this.currentHeatingCoolingState);
        });

        characteristic.on('set', (value, callback) => {
            this.currentHeatingCoolingState = value;
            this.updateCurrentHeatingCoolingState();

            callback(null);
        });
    }


    enableTargetHeatingCoolingState() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.TargetHeatingCoolingState);

        characteristic.on('get', callback => {
            callback(null, this.targetHeatingCoolingState);
        });

        characteristic.on('set', (value, callback) => {
            this.targetHeatingCoolingState = value;
            this.updateCurrentHeatingCoolingState();

            callback(null);
        });

    }


    enableCurrentTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CurrentTemperature);

        characteristic.setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: 0.1
        });

        characteristic.on('get', callback => {
            callback(null, this.currentTemperature);
        });

        characteristic.on('set', (value, callback) => {
            this.currentTemperature = value;
            this.updateCurrentHeatingCoolingState();

            callback(null);
        });
    }

    enableTargetTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.TargetTemperature);

        characteristic.setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: 0.1
        });

        characteristic.on('get', callback => {
            callback(null, this.targetTemperature);
        });

        characteristic.on('set', (value, callback) => {
            this.targetTemperature = value;
            this.updateCurrentHeatingCoolingState();

            callback(null);
        });

    }

    enableDisplayUnits() {
        // °C or °F for units
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.TemperatureDisplayUnits);

        characteristic.on('get', callback => {
            callback(null, this.temperatureDisplayUnits);
        });
        characteristic.on('set', (value, callback) => {
            this.temperatureDisplayUnits = value;

            callback(null);
        });
    }

    enableCoolingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CoolingThresholdTemperature);

        characteristic.on('get', callback => {
            callback(null, this.coolingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.coolingThresholdTemperature = value;
            this.updateCurrentHeatingCoolingState();

            callback(null);
        });

    }

    enableHeatingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.HeatingThresholdTemperature);

        characteristic.on('get', callback => {
            callback(null, this.heatingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.heatingThresholdTemperature = value;
            this.updateCurrentHeatingCoolingState();
            
            callback(null);
        });

    }


    shouldTurnOnHeating() {

        switch (this.targetHeatingCoolingState) {
            case Characteristic.TargetHeatingCoolingState.AUTO:
                return this.currentTemperature < this.heatingThresholdTemperature;

            case Characteristic.TargetHeatingCoolingState.HEAT:
                return this.currentTemperature < this.targetTemperature;

        }

        return false;

    }

    shouldTurnOnCooling() {
        switch (this.targetHeatingCoolingState) {
            case Characteristic.TargetHeatingCoolingState.AUTO:
                return this.currentTemperature > this.coolingThresholdTemperature;

            case Characteristic.TargetHeatingCoolingState.COOL:
                return this.currentTemperature > this.targetTemperature;

        }

        return false;
    }




    updateCurrentHeatingCoolingState() {

        var service = this.getService(Service.Thermostat);
        var state = this.currentHeatingCoolingState;

        if (this.shouldTurnOnHeating()) {
            state = Characteristic.CurrentHeatingCoolingState.HEAT;
        } else if (this.shouldTurnOnCooling()) {
            state = Characteristic.CurrentHeatingCoolingState.COOL;
        } else {
            state = Characteristic.CurrentHeatingCoolingState.OFF;
        }

        if (state != this.currentHeatingCoolingState) {
            switch (state) {
                case Characteristic.CurrentHeatingCoolingState.OFF: {
                    this.log('Turning off since current temperature is', this.currentTemperature, '.');
                    notification = this.config.notifications ? this.config.notifications.OFF : null;
                    break;
                }
                case Characteristic.CurrentHeatingCoolingState.HEAT: {
                    this.log('Turning on heat since current temperature is', this.currentTemperature, '.');
                    notification = this.config.notifications ? this.config.notifications.HEAT : null;
                    break;
                }
                case Characteristic.CurrentHeatingCoolingState.COOL: {
                    this.log('Turning on cool since current temperature is', this.currentTemperature, '.');
                    notification = this.config.notifications ? this.config.notifications.COOL : null;
                    break;
                }
            }


            service.setCharacteristic(Characteristic.CurrentHeatingCoolingState, state);
        }

    }


}

