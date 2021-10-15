var TeslaAPI = require('./tesla-api-request.js');
var Events = require('events');
var {Service, Characteristic} = require('./homebridge.js');


var DoorLockAccessory = require('./accessories/door-lock.js');
var ChargingAccessory = require('./accessories/charging.js');
var AirConditioningAccessory = require('./accessories/hvac.js');
var InsideTemperatureAccessory = require('./accessories/inside-temperature.js');
var OutsideTemperatureAccessory = require('./accessories/outside-temperature.js');
var PingAccessory = require('./accessories/ping.js');
var ThermostatAccessory = require('./accessories/thermostat.js');
var TrunkAccessory = require('./accessories/trunk.js');


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
		this.api = new TeslaAPI({token:config.token, vin:config.vin});
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
		addAccessory(TrunkAccessory, 'trunk');

		var vehicleData = await this.getVehicleData();
		var model = 'Unknown';
		
		vehicleData.option_codes.split(',').forEach((code) => {
            switch(code) {
                case 'MDLS':
                case 'MS03':
                case 'MS04': {
                    model = 'Model S';
                    break;
                }
                case 'MDLX': {
                    model = 'Model X';
                    break;
                }
                case 'MDL3': {
                    model = 'Model 3';
                    break;
                }
                case 'MDLY': {
                    model = 'Model Y';
                    break;
                }
            }            
        });

		// Update all accessories with info from Tesla
		accessories.forEach((accessory) => {
			var service = accessory.getService(Service.AccessoryInformation);
			service.setCharacteristic(Characteristic.Name, accessory.name);
			service.setCharacteristic(Characteristic.Manufacturer, "Tesla");
			service.setCharacteristic(Characteristic.Model, model);
			service.setCharacteristic(Characteristic.SerialNumber, `${vehicleData.vin}`);
			service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicleData.vehicle_state.car_version}`);
			
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
		this.emit('vehicle_data', vehicle_data);
		return vehicle_data;
    }

	async request(method, path, options) {
		var response = await this.api.request(method, path, options);
		this.emit('response', response);
		return response;
	}

	async post(path, body) {
		return this.request('POST', path, {body:body});
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
