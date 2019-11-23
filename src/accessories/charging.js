
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        var defaultConfig = {
            "name": "Charging",
            "enabled": true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.batteryLevel = undefined;
        this.isActive = false;
        this.isCharging = false;

        this.enableSwitch();
        this.enableBatteryLevel();

        this.vehicle.on('vehicleData', (vehicleData) => {    
            this.updateSwitch(vehicleData);
            this.updateBatteryLevel(vehicleData);
        });

    }

    updateSwitch(vehicleData) {
        var service = this.getService(Service.Switch);

        if (vehicleData.isChargingStopped() || vehicleData.isChargingDisconnected())
            this.isActive = false;
        else 
            this.isActive = true;

        this.debug(`Updated charging state to ${this.isActive ? 'ON' : 'OFF'} (vehicle charging state is "${vehicleData.getChargingState()}").`);        
        service.getCharacteristic(Characteristic.On).updateValue(this.isActive);
    }

    updateBatteryLevel(vehicleData) {
        var service = this.getService(Service.BatteryService);

        this.isCharging = vehicleData.isCharging();
        this.batteryLevel = vehicleData.getBatteryLevel();

        this.debug(`Updated battery level to ${this.batteryLevel}%.`);
        service.getCharacteristic(Characteristic.BatteryLevel).updateValue(vehicleData.batteryLevel);
    }


    enableSwitch() {
        var service = new Service.Switch(this.name, __filename);
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isActive);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setActiveState(value).then(() => {
                callback(null, this.isActive);
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })
        });
    }


    enableBatteryLevel() {
        var service = new Service.BatteryService(this.name);
        this.addService(service);

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
            callback(null, this.batteryLevel);    
        });

        service.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
            callback(null, this.isCharging ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING);    
        });

    }
    


    setChargingState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return value ? this.vehicle.chargePortDoorOpen() : this.vehicle.chargeStop();
            })
            .then(() => {
                return value ? this.vehicle.chargeStart() : this.vehicle.chargePortDoorOpen();
            })
            .then(() => {
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
        });
    }    


    setActiveState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {

            this.debug(`Setting charging state to "${value}".`);

            Promise.resolve().then(() => {
                return Promise.resolve();
            })
            .then(() => {
                this.isActive = value;
                this.setChargingState(value);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    
        })
    }



}

