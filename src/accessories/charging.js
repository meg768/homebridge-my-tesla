
var {Service, Characteristic} = require('../homebridge.js');
var Switch = require('./core/switch.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Charging"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.enableBatteryService();

        this.vehicle.on('vehicle_data', (vehicleData) => {    
			var chargingState = vehicleData.charge_state.charging_state == "Charging" ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING;
			this.updateSwitchState(chargingState == Characteristic.ChargingState.CHARGING);
        });



    }

    enableBatteryService() {
        var service = new Service.BatteryService(this.name);
        var batteryLevel = undefined;
        var chargingState = undefined;

        this.addService(service);

        var getBatteryLevel = () => {
            return batteryLevel;
        }

        var getChargingState = () => {
            return chargingState;
        }


		this.vehicle.on('vehicle_data', (vehicleData) => {   
			
            chargingState = vehicleData.charge_state.charging_state == "Charging" ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING;
            batteryLevel  = vehicleData.charge_state.battery_level;

            this.debug(`Updated battery level to ${batteryLevel}% and charging state to ${chargingState == Characteristic.ChargingState.CHARGING ? "ON" : "OFF"}.`);

            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(batteryLevel);
            service.getCharacteristic(Characteristic.ChargingState).updateValue(chargingState);
        });

        this.enableCharacteristic(Service.BatteryService, Characteristic.BatteryLevel, getBatteryLevel);
        this.enableCharacteristic(Service.BatteryService, Characteristic.ChargingState, getChargingState);
    }
    
    async turnOn() {
		await this.vehicle.post('command/charge_port_door_open');
		await this.vehicle.post('command/charge_start');

		setTimeout(() => {
			this.vehicle.getVehicleData();
		}, 5000);
	}

    async turnOff() {
		await this.vehicle.post('command/charge_stop');
		await this.vehicle.post('command/charge_port_door_close');

		setTimeout(() => {
			this.vehicle.getVehicleData();
		}, 5000);

	}



}

