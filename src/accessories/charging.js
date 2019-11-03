
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

        this.on('vehicleData', (data) => {    
            if (true) {
                var service = this.getService(Service.Switch);

                this.isCharging = data.isCharging();
                this.debug(`Updated charging state to ${this.isCharging ? 'CHARGING' : 'NOT CHARGING'}...`);
                
                service.getCharacteristic(Characteristic.On).updateValue(this.isCharging);
            }

            if (true) {
                var service = this.getService(Service.BatteryService);

                this.batteryLevel = data.getBatteryLevel();
                this.debug(`Updated battery level to ${this.batteryLevel}%.`);
    
                service.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.batteryLevel);
            }
        });

    }


    enableSwitch() {
        var service = new Service.Switch(this.name, "charging");
        this.addService(service);

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, this.isCharging);
        });
    
        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var setChargingState = (state) => {
                return new Promise((resolve, reject) => {
                    Promise.resolve().then(() => {
                        return state ? this.api.chargePortDoorOpen() : this.api.chargeStop();
                    })
                    .then(() => {
                        return state ? this.api.chargeStart() : this.api.chargePortDoorOpen();
                    })
                    .then(() => {
                        resolve(state);
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
                setChargingState(value).then(() => {
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

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
            callback(null, this.batteryLevel);    
        });

        service.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
            callback(null, this.isCharging ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING);    
        });

    }


}

