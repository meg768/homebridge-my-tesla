
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var VehicleData = require('../vehicle-data.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.batteryLevel = undefined;
        this.isActive = false;
        this.isCharging = false;

        this.enableSwitch();
        this.enableBatteryLevel();

        this.on('vehicleData', (vehicleData) => {    
            this.updateSwitch(vehicleData);
            this.updateBatteryLevel(vehicleData);
        });

    }

    updateSwitch(vehicleData) {
        var service = this.getService(Service.Switch);

        this.debug(`Charging state is "${vehicleData.getChargingState()}".`);
        this.isActive = !vehicleData.isChargingDisconnected(); 

        this.debug(`Updated charging state to ${this.isActive ? 'ON' : 'OFF'}.`);        
        service.getCharacteristic(Characteristic.On).updateValue(this.isActive);
    }

    updateBatteryLevel(vehicleData) {
        var service = this.getService(Service.BatteryService);

        this.isCharging = vehicleData.isCharging();
        this.batteryLevel = vehicleData.getBatteryLevel();

        this.debug(`Updated battery level to ${this.batteryLevel}%.`);
        service.getCharacteristic(Characteristic.BatteryLevel).updateValue(vehicleData.batteryLevel);
    }

    pause(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
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
                return value ? this.api.chargePortDoorOpen() : this.api.chargeStop();
            })
            .then(() => {
                return value ? this.api.chargeStart() : this.api.chargePortDoorOpen();
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

