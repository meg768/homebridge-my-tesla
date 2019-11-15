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


        super({log:platform.log, debug:platform.debug, vin:config.vin});

        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;
/*
        this.addFeature(DoorLockAccessory, 'doors');
        this.addFeature(ChargingAccessory, 'charging');
        this.addFeature(AirConditioningAccessory, 'hvac');
        this.addFeature(PingAccessory, 'ping');
        this.addFeature(InsideTemperatureAccessory, 'insideTemperature');
        this.addFeature(ThermostatAccessory, 'thermostat');
        this.addFeature(OutsideTemperatureAccessory, 'outsideTemperature');
        
        var configLoginOptions = {username:config.username, password:config.password, clientID:config.clientID, clientSecret:config.clientSecret};
        var processLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...processLoginOptions};

        this.debug(loginOptions);

        this.login(loginOptions).then(() => {
            this.debug('Login completed.');
            return Promise.resolve();
        })
        .then(() => {
            return this.getVehicleData();
        })
        .then((vehicleData) => {
            this.accessories.forEach((accessory) => {
                var service = accessory.getService(Service.AccessoryInformation);
                service.setCharacteristic(Characteristic.Name, accessory.name);
                service.setCharacteristic(Characteristic.Manufacturer, "XXX");
                service.setCharacteristic(Characteristic.Model, "YYY");
                service.setCharacteristic(Characteristic.SerialNumber, "ZZZ");
            })
        })
        .catch((error) => {
            this.log(error);
        });
*/

    }

    getAccessories() {

        var accessories = [];

        var addAccessory = (fn, name) => {
            var feature = this.config.features ? this.config.features[name] : undefined;

            if (feature != undefined) {
                if (feature.enabled == undefined || feature.enabled) {
                    accessories.push(new fn({vehicle:this, config:feature}));
                }
            }
            else {
                accessories.push(new fn({vehicle:this, config:{}}));

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
                accessories.forEach((accessory) => {
                    var service = accessory.getService(Service.AccessoryInformation);
                    service.setCharacteristic(Characteristic.Name, accessory.name);
                    service.setCharacteristic(Characteristic.Manufacturer, "Tesla");
                    service.setCharacteristic(Characteristic.Model, vehicleData.getModel());
                    service.setCharacteristic(Characteristic.SerialNumber, `VIN ${vehicleData.getVIN()}`);
                    service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicleData.getCarVersion()}`);
                    
                })

                resolve(accessories);
            })
            .catch((error) => {
                reject(error);
            }); 

        }); 
    }

    login() {
        var configLoginOptions = {username:this.config.username, password:this.config.password, clientID:this.config.clientID, clientSecret:this.config.clientSecret};
        var processLoginOptions = {username:process.env.TESLA_USER, password:process.env.TESLA_PASSWORD, clientID:process.env.TESLA_CLIENT_ID, clientSecret:process.env.TESLA_CLIENT_SECRET};
        var loginOptions = {...configLoginOptions, ...processLoginOptions};

        return super.login(loginOptions);
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
