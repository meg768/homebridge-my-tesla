
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
        this.outsideTemperature = 20;

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
            this.outsideTemperature = vehicleData.climate_state.outside_temp;
            this.currentTemperature = vehicleData.climate_state.inside_temp;
            this.currentHeatingCoolingState = vehicleData.climate_state.is_climate_on == true;

            service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(this.currentTemperature);
            this.debug(`Updating temperature for thermostat to ${this.currentTemperature} °C.`); 

            service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(this.currentHeatingCoolingState);
            this.debug(`Updating air conditioner state for thermostat to "${this.currentHeatingCoolingState ? 'ON' : 'OFF'}".`);  


            await this.checkTemperature(vehicleData);
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
                this.delayedCheckTemperature();

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
            callback(null, this.currentTemperature);
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
            this.delayedCheckTemperature();
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
            this.delayedCheckTemperature();
            callback(null);
        });
    }

    enableCoolingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.CoolingThresholdTemperature);

        characteristic.setProps({
            minValue: 30,
            maxValue: 50,
            minStep: 1
        });

        characteristic.on('get', callback => {
            callback(null, this.coolingThresholdTemperature);
        });
        characteristic.on('set', (value, callback) => {
            this.coolingThresholdTemperature = value;
            this.delayedCheckTemperature();

            callback(null);
        });

    }

    enableHeatingThresholdTemperature() {
        var service = this.getService(Service.Thermostat);
        var characteristic = service.getCharacteristic(Characteristic.HeatingThresholdTemperature);

        characteristic.setProps({
            minValue: 0,
            maxValue: 15,
            minStep: 1
        });


        characteristic.on('get', callback => {
            callback(null, this.heatingThresholdTemperature);
        });

        characteristic.on('set', (value, callback) => {
            this.heatingThresholdTemperature = value;
            this.delayedCheckTemperature();

            callback(null);
        });

    }


    async delayedCheckTemperature(delay = 1000) {
        this.timer.setTimer(delay, async () => {
            if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF)
                await this.checkTemperature();
    
        });
    }

    async checkTemperature(vehicleData) {

        this.debug(`Checking temperatures for thermostat...`);

        var ACTION_START_HVAC            = 1;
        var ACTION_STOP_HVAC             = 2;
        var ACTION_NONE                  = 4;

        if (vehicleData == undefined)
            this.vehicleData = vehicleData = await this.vehicle.getVehicleData();

		var action = ACTION_NONE;

        var isClimateOn = vehicleData.climate_state.fan_status != 0;
        var insideTemperature = vehicleData.climate_state.inside_temp;
        var batteryLevel = vehicleData.charge_state.battery_level;
        var isPluggedIn = vehicleData.charge_state.charge_port_door_open;
        var isDriving = vehicleData.drive_state.shift_state != null;

        this.debug(`Thresholds [${this.heatingThresholdTemperature} - ${this.coolingThresholdTemperature}], climate is ${isClimateOn ? 'ON' : 'OFF'}`);

		if (insideTemperature < this.heatingThresholdTemperature) {
			this.debug(`Starting HVAC since temperature is too low, ${insideTemperature}.`);
            action = ACTION_START_HVAC;
		}
		else if (insideTemperature > this.coolingThresholdTemperature) {
			this.debug(`Starting HVAC since temperature is too high, ${insideTemperature}.`);
            action = ACTION_START_HVAC;
		}
        else if (insideTemperature <= vehicleData.climate_state.max_avail_temp && insideTemperature >= vehicleData.climate_state.min_avail_temp) {
            action = ACTION_STOP_HVAC;

        }
		else {
			this.debug(`Current temperature is ${insideTemperature} °C and inside the limits of [${this.heatingThresholdTemperature} - ${this.coolingThresholdTemperature}] °C.`);
            action = ACTION_NONE;
		}

		switch(action) {
			case ACTION_START_HVAC: {
                if (!isClimateOn)
    				await this.setAutoConditioningState(true);
				break;
            }
			case ACTION_STOP_HVAC: {
                if (isClimateOn)
    				await this.setAutoConditioningState(false);

				break;
			}
		}

		if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF)
			this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));

    }


    async checkTemperature_old(vehicleData) {

        this.debug(`Checking temperatures for thermostat...`);

        var ACTION_START_HVAC            = 1;
        var ACTION_STOP_HVAC             = 2;
        var ACTION_NONE                  = 4;
        var ACTION_STOP_TIMER            = 7;

        if (vehicleData == undefined)
            vehicleData = await this.vehicle.getVehicleData();

		var action = ACTION_NONE;

        var insideTemperature = vehicleData.climate_state.inside_temp;
        var batteryLevel = vehicleData.charge_state.battery_level;
        var isClimateOn = vehicleData.climate_state.is_climate_on;
        var isPluggedIn = vehicleData.charge_state.charge_port_door_open;
        var isDriving = vehicleData.drive_state.shift_state != null;

        this.debug('coolingThresholdTemperature', this.coolingThresholdTemperature);
        this.debug('heatingThresholdTemperature', this.heatingThresholdTemperature);
        this.debug('isClimateOn', vehicleData.climate_state.is_climate_on);

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

		switch(action) {
			case ACTION_START_HVAC:
			case ACTION_STOP_HVAC: {
				await this.setAutoConditioningState(action == ACTION_START_HVAC ? true : false);
				break;
			}
		}

		if (this.targetHeatingCoolingState != Characteristic.TargetHeatingCoolingState.OFF)
			this.timer.setTimer(this.timerInterval, this.checkTemperature.bind(this));

    }


    async autoConditioningStart() {
        return await this.vehicle.post('command/auto_conditioning_start');
    }

    async autoConditioningStop() {
        return await this.vehicle.post('command/auto_conditioning_stop');
    }



    async setAutoConditioningState(value) {
        value = value ? true : false;

		value ? await this.autoConditioningStart() : await this.autoConditioningStop();

		await this.pause(2000);
		await this.vehicle.getVehicleData();
	}


}

