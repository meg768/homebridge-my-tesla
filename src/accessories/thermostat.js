
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

        var config = {
            "name": 'Thermostat',
            "timerInterval": 5,
            "requiredBatteryLevel": 40,
            "enabled": true
        }

        super({...options, config:Object.assign({}, config, options.config)});

        this.timer = new Timer();
        this.timerInterval = this.config.timerInterval * 60 * 1000;

        this.vehicleData = undefined;
        this.minTemperature = 0;
        this.maxTemperature = 40;

        this.currentTemperature = 20;
        this.targetTemperature = 20;

        this.heatingThresholdTemperature = 5;
        this.coolingThresholdTemperature = 30;
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

		this.vehicle.on('vehicle_data', async (vehicleData) => {
            var service = this.getService(Service.Thermostat);

            this.vehicleData = vehicleData;
            this.currentTemperature = vehicleData.climate_state.inside_temp;
            this.currentHeatingCoolingState = vehicleData.climate_state.is_auto_conditioning_on == true;

            let isDriving = this.vehicleData.drive_state.shift_state != null;

            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
            this.debug(`Updating temperature for thermostat to ${this.currentTemperature} °C.`); 

            service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(this.currentHeatingCoolingState);
            this.debug(`Updating air conditioner state for thermostat to "${this.currentHeatingCoolingState ? 'ON' : 'OFF'}".`);  

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
                this.updateHVAC(1000);

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

        characteristic.on('get', callback => {
            callback(null, this.vehicleData.climate_state.inside_temp);
        });

    }

    enableTargetTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.TargetTemperature);

        /*
        characteristic.setProps({
            minValue: this.minTemperature,
            maxValue: this.maxTemperature,
            minStep: 0.1
        });
        */

        characteristic.on('get', callback => {
            callback(null, this.targetTemperature);
        });

        characteristic.on('set', (value, callback) => {
            this.targetTemperature = value;
            this.updateHVAC(1000);
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
            this.updateHVAC(1000);
            callback(null);
        });
    }

    enableCoolingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CoolingThresholdTemperature);
/*
        characteristic.setProps({
            minValue: 30,
            maxValue: 50,
            minStep: 1
        });
*/
        characteristic.on('get', callback => {
            callback(null, this.coolingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.coolingThresholdTemperature = value;
            this.updateHVAC(1000);

            callback(null);
        });

    }

    enableHeatingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.HeatingThresholdTemperature);

        /*
        characteristic.setProps({
            minValue: 0,
            maxValue: 15,
            minStep: 1
        });
*/

        characteristic.on('get', callback => {
            callback(null, this.heatingThresholdTemperature);
        });

        characteristic.on('set', (value, callback) => {
            this.heatingThresholdTemperature = value;
            this.updateHVAC(1000);

            callback(null);
        });

    }


    async updateHVAC(delay) {


        if (delay != undefined) {
            this.timer.setTimer(delay, async () => {
                await this.updateHVAC();
            });

            return;
        }

        let vehicleData = this.vehicleData = await this.vehicle.getVehicleData();

        if (typeof vehicleData != 'object') {
            return;
        }

        let ACTION_START_HVAC            = 1;
        let ACTION_STOP_HVAC             = 2;
        let ACTION_NONE                  = 4;
		
        let action = ACTION_NONE;
        let isClimateOn = vehicleData.climate_state.is_auto_conditioning_on;
        let insideTemperature = vehicleData.climate_state.inside_temp;
        let batteryLevel = vehicleData.charge_state.battery_level;
        let isPluggedIn = vehicleData.charge_state.charge_port_door_open;
        let isDriving = vehicleData.drive_state.shift_state != null;
        let wantedInsideTemperature = (vehicleData.climate_state.driver_temp_setting + vehicleData.climate_state.passenger_temp_setting) / 2;

        if (!isDriving) {
            this.debug(`Checking temperatures. Threshold is [${this.heatingThresholdTemperature} - ${this.coolingThresholdTemperature}], climate is ${isClimateOn ? 'ON' : 'OFF'}, current temperature is ${insideTemperature} °C.`);

            if (this.targetHeatingCoolingState == Characteristic.TargetHeatingCoolingState.OFF) {
                if (isClimateOn) {
                    this.debug(`Thermostat turned off, stopping HVAC.`);
                    action = ACTION_STOP_HVAC;    
                }
            }
            else if (batteryLevel < this.requiredBatteryLevel) {
                if (isClimateOn) {
                    this.debug(`Thermostat turned off since battery level is too low, stopping HVAC.`);
                    action = ACTION_STOP_HVAC;    
                }
            }
            else if (isDriving) {
                if (isClimateOn) {
                    this.debug(`Thermostat turned off since driving, stopping HVAC.`);
                    action = ACTION_STOP_HVAC;    
                }
            }
            else if (insideTemperature < this.heatingThresholdTemperature) {
                if (!isClimateOn) {
                    this.debug(`Starting HVAC since temperature is too low, ${insideTemperature}.`);
                    action = ACTION_START_HVAC;    
                }
            }
            else if (insideTemperature > this.coolingThresholdTemperature) {
                if (!isClimateOn) {
                    this.debug(`Starting HVAC since temperature is too high, ${insideTemperature}.`);
                    action = ACTION_START_HVAC;    
                }
            }
            else if (Math.abs(insideTemperature - wantedInsideTemperature) < 2) {
                if (isClimateOn) {
                    this.debug(`Temperature is close to wanted (${insideTemperature}), stopping HVAC.`);
                    action = ACTION_STOP_HVAC;    
                }
            }
            else {
                this.debug(`Current temperature is ${insideTemperature} °C and inside the limits of [${this.heatingThresholdTemperature} - ${this.coolingThresholdTemperature}] °C.`);
                action = ACTION_NONE;
            }
    
            switch(action) {
                case ACTION_START_HVAC: {
                    await this.setAutoConditioningState(true);
                    break;
                }
                case ACTION_STOP_HVAC: {
                    await this.setAutoConditioningState(false);
                    break;
                }
            }
    
    
        }
        else {
            this.debug(`Currently driving. Nothing to do.`);
        }

        this.timer.cancel();

        // Set a new timer if thermostat active
		if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF) {
            this.updateHVAC(this.timerInterval);

        }

    }



    async autoConditioningStart() {
        this.debug(`Turning HVAC on.`);
        return await this.vehicle.post('command/auto_conditioning_start');
    }

    async autoConditioningStop() {
        this.debug(`Turning HVAC off.`);
        return await this.vehicle.post('command/auto_conditioning_stop');
    }



    async setAutoConditioningState(value) {
        value = value ? true : false;

		value ? await this.autoConditioningStart() : await this.autoConditioningStop();

		await this.pause(2000);
		await this.vehicle.getVehicleData();
	}


}

