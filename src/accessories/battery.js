
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {

		var config = {
            "name": "Battery"
        };

		super({...options, config:{...config, ...options.config}});

        //this.addService(new Service.ContactSensor(this.name));
        this.addService(new Service.Battery(this.name));
        
		this.chargingState = Characteristic.ChargingState.NOT_CHARGING;
		this.batteryLevel = 50;
		this.contactSensorState = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

		this.vehicle.on('vehicle_data', (vehicleData) => {   
			
			try {
				this.chargingState = vehicleData.charge_state.charging_state == "Charging" ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING;
				this.batteryLevel  = vehicleData.charge_state.battery_level;
				this.contactSensorState = this.chargingState;
				
				this.debug(`Updating battery level to ${this.batteryLevel}% and charging state to ${this.chargingState == Characteristic.ChargingState.CHARGING ? "ON" : "OFF"}.`);
	
				this.getService(Service.Battery).getCharacteristic(Characteristic.BatteryLevel).updateValue(this.batteryLevel);
				this.getService(Service.Battery).getCharacteristic(Characteristic.ChargingState).updateValue(this.chargingState);
	
			}
			catch(error) {
				this.log(error);
			}
        });


//		this.enableCharacteristic(Service.ContactSensor, Characteristic.ContactSensorState, () => {
//			return this.contactSensorState;
//		});

		this.enableCharacteristic(Service.Battery, Characteristic.StatusLowBattery, () => {
			return this.batteryLevel < 0.2 ? 1 : 0;
		});

		this.enableCharacteristic(Service.Battery, Characteristic.BatteryLevel, () => {
			return this.batteryLevel;
		});

		this.enableCharacteristic(Service.Battery, Characteristic.ChargingState, () => {
			return this.chargingState;
		});

    }; 


}

