var TeslaAPI = require('./tesla-api.js');
var Events = require('events');
var {Service, Characteristic} = require('./homebridge.js');


var DoorLockAccessory = require('./accessories/door-lock.js');
var ChargingAccessory = require('./accessories/charging.js');
var AirConditioningAccessory = require('./accessories/hvac.js');
var InsideTemperatureAccessory = require('./accessories/inside-temperature.js');
var OutsideTemperatureAccessory = require('./accessories/outside-temperature.js');
var PingAccessory = require('./accessories/ping.js');
var ThermostatAccessory = require('./accessories/thermostat.js');


module.exports = class Vehicle extends Events  {

    constructor(platform, config) {

		super();

		this.log = platform.log;
		this.debug = platform.debug;
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;
		this.api = new TeslaAPI({token:config.token, vin:config.vin, username:config.username, password:config.password});
    }




    async getAccessories() {

        var accessories = [];

        var addAccessory = (fn, name) => {
            var accessoryConfig = this.config.accessories ? this.config.accessories[name] : undefined;

            if (accessoryConfig != undefined) {
                if (accessoryConfig.enabled == undefined || accessoryConfig.enabled) {
                    accessories.push(new fn({vehicle:this, config:accessoryConfig}));
                }
            }
            else {
                accessories.push(new fn({vehicle:this}));

            }

        };



		addAccessory(DoorLockAccessory, 'doors');
		addAccessory(ChargingAccessory, 'charging');
		addAccessory(AirConditioningAccessory, 'hvac');
		addAccessory(PingAccessory, 'ping');
		addAccessory(InsideTemperatureAccessory, 'insideTemperature');
		addAccessory(ThermostatAccessory, 'thermostat');
		addAccessory(OutsideTemperatureAccessory, 'outsideTemperature');

		var vehicleData = await this.getVehicleData();

		// Update all accessories with info from Tesla
		accessories.forEach((accessory) => {
			var service = accessory.getService(Service.AccessoryInformation);
			service.setCharacteristic(Characteristic.Name, accessory.name);
			service.setCharacteristic(Characteristic.Manufacturer, "Tesla");
			service.setCharacteristic(Characteristic.Model, vehicleData.getModel());
			service.setCharacteristic(Characteristic.SerialNumber, `${vehicleData.getVIN()}`);
			service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicleData.vehicleState.getCarVersion()}`);
			
		})

		return accessories;
		
    }

	getVehicle() {
        return this.api.vehicle;
    }

    getVehicleID() {
        return this.api.vehicle.id_s;
    }

	async getVehicleData() {
		var vehicle_data = await this.get('vehicle_data');

		var VehicleData = require('./vehicle-data.js');
		var vehicleData = new VehicleData(vehicle_data);

		this.emit('vehicle_data', vehicle_data);
		this.emit('vehicleData', vehicleData);
		return vehicleData;
    }

	async request(method, path) {
		var response = await this.api.request(method, path);
		this.emit('response', response);
		return response;
	}

	async post(path) {
		return this.request('POST', path);
	}

	async get(path) {
		return this.request('GET', path);
	}

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }


}
