
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Switch = require('./switch.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Charging"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.enableBatteryService();

        this.vehicle.on('vehicleData', (vehicleData) => {    
            if (vehicleData.chargeState.isChargingStopped() || vehicleData.chargeState.isChargingDisconnected())
                this.updateSwitchState(false);
            else 
                this.updateSwitchState(true);
                
        });

    }

    enableBatteryService() {
        var service = new Service.BatteryService(this.name);
        var batteryLevel = undefined;
        var chargingState = undefined;

        this.addService(service);

        this.vehicle.on('vehicleData', (vehicleData) => {    
            chargingState = vehicleData.chargeState.isCharging() ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING;
            batteryLevel = vehicleData.chargeState.getBatteryLevel();

            this.debug(`Updated battery level to ${batteryLevel}% and charging state to ${chargingState == Characteristic.ChargingState.CHARGING ? "ON" : "OFF"}.`);

            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(batteryLevel);
            service.getCharacteristic(Characteristic.ChargingState).updateValue(chargingState);
        });

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
            callback(null, batteryLevel);    
        });

        service.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
            callback(null, chargingState);    
        });

    }
    
    turnOn() {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.vehicle.chargePortDoorOpen();
            })
            .then(() => {
                return this.vehicle.chargeStart();
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

    turnOff() {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.vehicle.chargeStop();
            })
            .then(() => {
                return this.vehicle.chargePortDoorClose();
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




}

