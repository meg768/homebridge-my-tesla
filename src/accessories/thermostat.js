
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

        var service = new Service.Thermostat(this.name, __filename);
        this.addService(service);

        this.enableCurrentHeatingCoolingState(service);
        this.enableTargetHeatingCoolingState(service);
        this.enableCurrentTemperature(service);
        this.enableTargetTemperature(service);
        this.enableCoolingThresholdTemperature(service);
        this.enableHeatingThresholdTemperature(service);
        this.enableDisplayUnits(service);
    }
    



    enableCurrentHeatingCoolingState(service) {
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


    enableTargetHeatingCoolingState(service) {
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


    enableCurrentTemperature(service) {
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

    enableTargetTemperature(service) {
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

    enableDisplayUnits(service) {
        // °C or °F for units
        var characteristic = service.getCharacteristic(Characteristic.TemperatureDisplayUnits);

        characteristic.on('get', callback => {
            callback(null, this.temperatureDisplayUnits);
        });
        characteristic.on('set', (value, callback) => {
            this.temperatureDisplayUnits = value;

            callback(null);
        });
    }

    enableCoolingThresholdTemperature(service) {
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

    enableHeatingThresholdTemperature(service) {
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


    updateCurrentHeatingCoolingState() {
        this.debug('Updating heating/cooling state.')
    }

}

