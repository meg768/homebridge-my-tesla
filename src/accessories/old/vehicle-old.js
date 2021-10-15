var TeslaAPI = require('./tesla-api.js');
var merge = require('yow/merge');
var {Service, Characteristic} = require('./homebridge.js');


var DoorLockAccessory = require('./accessories/door-lock.js');
var ChargingAccessory = require('./accessories/charging.js');
var AirConditioningAccessory = require('./accessories/hvac.js');
var InsideTemperatureAccessory = require('./accessories/inside-temperature.js');
var OutsideTemperatureAccessory = require('./accessories/outside-temperature.js');
var PingAccessory = require('./accessories/ping.js');
var ThermostatAccessory = require('./accessories/thermostat.js');


module.exports = class Vehicle extends TeslaAPI  {

    constructor(platform, config) {

        super({log:platform.log, debug:platform.debug, vin:config.vin, username:config.username, password:config.password});

        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;
    }

    getAccessories() {

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

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.login();
            })
            .then(() => {
                addAccessory(DoorLockAccessory, 'doors');
                addAccessory(ChargingAccessory, 'charging');
                addAccessory(AirConditioningAccessory, 'hvac');
                addAccessory(PingAccessory, 'ping');
                addAccessory(InsideTemperatureAccessory, 'insideTemperature');
                addAccessory(ThermostatAccessory, 'thermostat');
                addAccessory(OutsideTemperatureAccessory, 'outsideTemperature');
            })
            .then(() => {
                return this.getVehicleData();                
            })
            .then((vehicleData) => {
                // Update all accessories with info from Tesla
                accessories.forEach((accessory) => {
                    var service = accessory.getService(Service.AccessoryInformation);
                    service.setCharacteristic(Characteristic.Name, accessory.name);
                    service.setCharacteristic(Characteristic.Manufacturer, "Tesla");
                    service.setCharacteristic(Characteristic.Model, vehicleData.getModel());
                    service.setCharacteristic(Characteristic.SerialNumber, `${vehicleData.getVIN()}`);
                    service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicleData.vehicleState.getCarVersion()}`);
                    
                })

                resolve(accessories);
            })
            .catch((error) => {
                reject(error);
            }); 

        }); 
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


    getVehicleData() {
        return new Promise((resolve, reject) => {
            this.request('GET', `/api/1/vehicles/${this.getVehicleID()}/vehicle_data`).then((response) => {
                var vehicleData = new VehicleData(response);
                this.emit('vehicleData', vehicleData);

                resolve(vehicleData);
            })
            .catch((error) => {
                reject(error);
            });

        });
    }

    doorLock() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/door_lock`);
    }

    doorUnlock() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/door_unlock`);
    }

    autoConditioningStart() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/auto_conditioning_start`);
    }

    autoConditioningStop() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/auto_conditioning_stop`);
    }

    chargePortDoorOpen() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_port_door_open`);
    }

    chargePortDoorClose() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_port_door_close`);
    }

    chargeStart() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_start`);
    }

    chargeStop() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_stop`);
    }

    remoteStartDrive() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/remote_start_drive?password=${this.password}`);
    }


}
