
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');

// Reminders...
// Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
// Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
// Characteristic.CurrentHeatingCoolingState.OFF = 0;
// Characteristic.CurrentHeatingCoolingState.HEAT = 1;
// Characteristic.CurrentHeatingCoolingState.COOL = 2;
// Characteristic.TargetHeatingCoolingState.OFF = 0;
// Characteristic.TargetHeatingCoolingState.HEAT = 1;
// Characteristic.TargetHeatingCoolingState.COOL = 2;
// Characteristic.TargetHeatingCoolingState.AUTO = 3;

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.maxTemperature = 30
        this.minTemperature = 0;

        this.currentTemperature = 20;
        this.targetTemperature = 20;

        this.heatingThresholdTemperature = 18;
        this.coolingThresholdTemperature = 21;

        this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

        // The value property of CurrentHeatingCoolingState must be one of the following:
        this.currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;

        // The value property of TargetHeatingCoolingState must be one of the following:
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
            var service = this.getService(Service.Thermostat);

            this.currentTemperature = data.getInsideTemperature();
            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
            this.debug(`Updated temperature for thermostat to ${this.currentTemperature} °C.`);  

            this.currentHeatingCoolingState = data.isAirConditionerOn();
            service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(this.currentHeatingCoolingState);
            this.debug(`Updated air conditioner state for thermostat to "${this.currentHeatingCoolingState}".`);  

        });


    }


    enableCurrentHeatingCoolingState() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CurrentHeatingCoolingState);

        characteristic.on('get', callback => {
            callback(null, this.currentHeatingCoolingState);
        });

    }


    enableTargetHeatingCoolingState() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.TargetHeatingCoolingState);

        // Allow only OFF or AUTO
        characteristic.setProps({
            validValues: [Characteristic.TargetHeatingCoolingState.OFF, Characteristic.TargetHeatingCoolingState.AUTO]
        });
      
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
            this.updateCurrentHeatingCoolingState();
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




    updateCurrentHeatingCoolingState() {

        var state = undefined;
        var temperatureRange = `[${this.heatingThresholdTemperature}-${this.coolingThresholdTemperature}]`;

        switch (this.targetHeatingCoolingState) {
            case Characteristic.TargetHeatingCoolingState.AUTO: {
                if (this.currentTemperature < this.heatingThresholdTemperature) {
                    state = Characteristic.CurrentHeatingCoolingState.HEAT;
                }
                else if (this.currentTemperature > this.coolingThresholdTemperature) {
                    state = Characteristic.CurrentHeatingCoolingState.OFF;
                }
                else {
                    state = Characteristic.CurrentHeatingCoolingState.OFF;
                }
                break;
            }

            case Characteristic.TargetHeatingCoolingState.OFF: {
                state = Characteristic.CurrentHeatingCoolingState.OFF;
                break;
            }


        }

        if (state != this.currentHeatingCoolingState) {
            switch (state) {
                case Characteristic.CurrentHeatingCoolingState.OFF: {
                    this.log(`Turning off conditioner since current temperature is ${this.currentTemperature} °C and temperature range is ${temperatureRange} °C`);
                    this.setAirConditioningState(false);
                    break;
                }
                case Characteristic.CurrentHeatingCoolingState.COOL:
                case Characteristic.CurrentHeatingCoolingState.HEAT: {
                    this.log(`Turning on air conditioner since current temperature is ${this.currentTemperature} °C and temperature range should be ${temperatureRange} °C`);
                    this.setAirConditioningState(true);
                    break;
                }
            }

        }
    
    }

    setAirConditioningState(value) {

        var value = value ? true : false; 

        this.debug(`Turning on ${value ? 'ON' : 'OFF'} air conditioner.`);

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return value ? this.vehicle.autoConditioningStart() : this.vehicle.autoConditioningStop();
            })
            .then(() => {
                // Seems we have to pause a bit so the air condition state is updated in getVehicleData()...
                return this.pause(1000);
            })
            .then(() => {
                return this.vehicle.getVehicleData();
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);                
            })
        })
    }


}

