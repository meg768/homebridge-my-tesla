
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var VehicleData = require('../vehicle-data.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.batteryLevel = undefined;
        this.isCharging = undefined;

        this.enableSwitch();
        this.enableBatteryLevel();
    }

    onVehicleData(data) {

    }

    enableSwitch() {
        var service = new Service.Switch(this.name, "charging");
        this.addService(service);

        this.on('vehicleData', (data) => {    
            this.isCharging = data.isCharging();
            this.debug(`Updated charging state to ${this.isCharging ? 'CHARGING' : 'NOT CHARGING'}...`);
            service.getCharacteristic(Characteristic.On).updateValue(this.isCharging);
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isCharging);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var startCharging = () => {
                return new Promise((resolve, reject) => {
                    Promise.resolve().then(() => {
                        return this.api.chargePortDoorOpen();
                    })
                    .then(() => {
                        return this.api.chargeStart();
                    })
                    .then(() => {
                        resolve(value);
                    })
                    .catch((error) => {
                        reject(error);
                    })
                });
            }
        
            var stopCharging = () => {
                return new Promise((resolve, reject) => {
                    Promise.resolve().then(() => {
                        return this.api.chargeStop();    
                    })
                    .then(() => {
                        return this.api.chargePortDoorOpen();
                    })
                    .then(() => {
                        resolve(value);
                    })
                    .catch((error) => {
                        reject(error);
                    })
                });        
            }

            if (value == this.isCharging) {
                callback(null, this.isCharging);                
            }
            else {
                Promise.resolve().then(() => {
                    return value ? startCharging() : stopCharging();
                })
                .then(() => {
                    callback(null, this.isCharging = value);
                })
                .catch((error) => {
                    this.log(error);
                    callback(null);
                })
            }
        });
    
    }

    enableBatteryLevel() {
        var service = new Service.BatteryService(this.name);
        this.addService(service);

        this.on('vehicleData', (data) => {
            this.batteryLevel = data.getBatteryLevel();
            this.debug(`Updated battery level to ${this.batteryLevel}%.`);

            service.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.batteryLevel);
        });

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
            callback(null, this.batteryLevel);    
        });

        service.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
            callback(null, this.isCharging ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING);    
        });

    }


}

