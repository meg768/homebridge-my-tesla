
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');
var merge = require('yow/merge');

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

        var defaultConfig = {
            "name": 'Thermostat',
            "timerInterval": 5,
            "requiredBatteryLevel": 40,
            "enabled": true
        }

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.setttingsTimer = new Timer();
        this.timer = new Timer();
        this.timerInterval = this.config.timerInterval * 60 * 1000;

        this.maxTemperature = 28;
        this.minTemperature = 0;

        this.currentTemperature = 20;
        this.targetTemperature = 20;
        this.outsideTemperature = 20;

        this.heatingThresholdTemperature = 18;
        this.coolingThresholdTemperature = 21;
        this.requiredBatteryLevel = this.config.requiredBatteryLevel;

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

            this.outsideTemperature = data.climateState.getOutsideTemperature();
            this.currentTemperature = data.climateState.getInsideTemperature();
            this.currentHeatingCoolingState = data.climateState.isClimateOn();

            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
            this.debug(`Updated temperature for thermostat to ${this.currentTemperature} °C.`); 

            service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(this.currentHeatingCoolingState);
            this.debug(`Updated air conditioner state for thermostat to "${this.currentHeatingCoolingState ? 'ON' : 'OFF'}".`);  

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

        var getTargetHeatingCoolingStateName = (value) => {
            var state = {};
            state[Characteristic.TargetHeatingCoolingState.OFF]  = 'OFF';
            state[Characteristic.TargetHeatingCoolingState.AUTO] = 'AUTO';
            state[Characteristic.TargetHeatingCoolingState.COOL] = 'COOL';
            state[Characteristic.TargetHeatingCoolingState.HEAT] = 'HEAT';

            return state[value] ? state[value] : 'UNKNOWN';
        }

        // Allow only OFF or AUTO
        characteristic.setProps({
            validValues: [Characteristic.TargetHeatingCoolingState.OFF, Characteristic.TargetHeatingCoolingState.AUTO]
        });
      
        characteristic.on('get', callback => {
            callback(null, this.targetHeatingCoolingState);
        });

        characteristic.on('set', (value, callback) => {
            if (this.targetHeatingCoolingState != value) {
                this.debug(`Setting thermostat to state "${getTargetHeatingCoolingStateName(value)}".`);
                this.targetHeatingCoolingState = value;
                this.updateSettings();

                if (value == Characteristic.TargetHeatingCoolingState.OFF) {
                    this.setAutoConditioningState(false);
                }
            }
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
            this.updateSettings();
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
            this.updateSettings();
            callback(null);
        });
    }

    enableCoolingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CoolingThresholdTemperature);

        characteristic.setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: 1
        });

        characteristic.on('get', callback => {
            callback(null, this.coolingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.coolingThresholdTemperature = value;
            this.updateSettings();

            callback(null);
        });

    }

    enableHeatingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.HeatingThresholdTemperature);

        characteristic.setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: 1
        });


        characteristic.on('get', callback => {
            callback(null, this.heatingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.heatingThresholdTemperature = value;
            this.updateSettings();

            callback(null);
        });

    }


    updateSettings() {
        this.setttingsTimer.setTimer(1000, () => {
            this.timer.cancel();

            if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF)
                this.checkTemperature();
    
        });
    }



    checkTemperature() {

        this.debug(`Checking temperatures for thermostat...`);

        var ACTION_START_HVAC            = 1;
        var ACTION_STOP_HVAC             = 2;
        var ACTION_NONE                  = 4;
        var ACTION_STOP_TIMER            = 7;

        Promise.resolve().then(() => {
            return this.vehicle.getVehicleData();
        })
        .then((response) => {
            return {action:ACTION_NONE, vehicleData:response};
        })
        .then((response) => {
            var {vehicleData, action} = response;

            var insideTemperature = vehicleData.climateState.getInsideTemperature();
            var batteryLevel = vehicleData.chargeState.getBatteryLevel();
            var isClimateOn = vehicleData.climateState.isClimateOn();
            var isPluggedIn = vehicleData.chargeState.isCharging() || vehicleData.chargeState.isChargingComplete() || vehicleData.chargeState.isChargingStopped();
            var isDriving = vehicleData.driveState.isDriving();

            if (isDriving) {
                this.log(`Turning off thermostat since car is currently driving.`);
                action = ACTION_STOP_TIMER;
            }
            else if (insideTemperature < this.heatingThresholdTemperature) {
                if (!isClimateOn) {

                    if (batteryLevel < this.requiredBatteryLevel) {
                        this.log(`Battery level is ${batteryLevel}%. Will not activate air conditioning since it is below ${this.requiredBatteryLevel}%.`);
                    }
                    else {
                        this.debug(`Starting air conditioner.`);
                        action = ACTION_START_HVAC;
                    }    
                }
            }
            else if (insideTemperature > this.coolingThresholdTemperature) {
                if (isClimateOn) {
                    this.debug(`Stopping air conditioner.`);
                    action = ACTION_STOP_HVAC;
                }
            }
            else {
                this.debug(`Current temperature is ${insideTemperature} °C and inside the limits of [${this.heatingThresholdTemperature} - ${this.coolingThresholdTemperature}] °C.`);
            }

            return ({vehicleData:vehicleData, action:action});
        })

        .then((response) => {
            var {vehicleData, action} = response;

            switch(action) {
                case ACTION_START_HVAC:
                case ACTION_STOP_HVAC: {

                    this.setAutoConditioningState(action == ACTION_START_HVAC ? true : false).then(() => {
                        return Promise.resolve();
                    })
                    .catch((error) => {
                        this.log(error);
                    })
                    break;
                }
            }

            return ({vehicleData:vehicleData, action:action});
        })

        .then((response) => {
            if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF)
                this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));
 
        })

        .catch((error) => {
            this.log(error);
        })

    }


    setAutoConditioningState(value) {
        value = value ? true : false;

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

