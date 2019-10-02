"use strict";

var Events   = require('events');
var isString = require('yow/is').isString;
var isObject = require('yow/is').isObject;
var isArray = require('yow/is').isArray;
var sprintf  = require('yow/sprintf');

var Request = require('yow/request');
var Timer   = require('yow/timer');

var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;

const OFF = true;
const ON = false;


module.exports = class Tesla extends Events  {

    constructor(platform, config) {

        super();

        this.log = platform.log;
        this.debug = platform.debug;
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.uuid = platform.generateUUID(config.vin);
        this.services = [];
        this.api = platform.api;
        this.platform = platform;
        this.refreshQueue = [];

        this.data = {};


        this.enableAccessoryInfo();
        this.enableDoorsLock();
        this.enableBatteryLevel();
        this.enableHVAC();
        this.enableTemperature();
        this.enableCharging();


        this.on('ready', () => {
            this.log('Ready!');

            this.refresh(() => {
                this.log('Initial refresh completed.');
            });
        });

    }

    enableCharging() {
        var service = new Service.Switch("Laddning");

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {

            this.refresh((response) => {
                var charging = false;

                if (response.charge_state) {
                    switch (response.charge_state.charging_state) {
                        case 'Disconnected': {
                            charging = false;
                            break;
                        }
                        case 'Stopped': {
                            charging = false;
                            break;
                        }
                        default: {
                            charging = true;
                            break;
                        }
                    }
                }

                callback(null, charging);
            });

        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {

            var vin = this.config.vin;

            if (value) {
                Promise.resolve().then(() => {
                    return this.api.setChargePortDoorState(vin, true);
                })
                .then(() => {
                    return this.api.setChargeState(vin, true);
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })
            }
            else {
                Promise.resolve().then(() => {
                    return this.api.setChargeState(vin, false);    
                })
                .then(() => {
                    return this.api.setChargePortDoorState(vin, false);
                })
                .then(() => {
                    callback(null, value);
                })
                .catch((error) => {
                    this.log(error);
                })

            }

        });



        this.services.push(service);

    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    refresh(callback) {

        this.refreshQueue.push(callback);

        if (this.refreshQueue.length == 1) {
            var vin = this.config.vin;

            this.log('Getting car state...');

            this.api.wakeUp(vin).then((response) => {
                return this.api.getVehicleData(vin);         
            })
            .then((response) => {
                return response;
            })
            .catch((error) => {
                this.log(error.stack);
            })
            .then((response) => {
                this.data = response;

                this.refreshQueue.forEach((callback) => {
                    callback(response);
                });

                this.log('Getting car state completed. Updated %d callbacks.', this.refreshQueue.length);
                this.refreshQueue = [];
            })
            .catch((error) => {
                this.log(error.stack);
            })
        }
    }



    enableTemperature() {
        var service = new Service.TemperatureSensor("Temperatur");

        service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {

            this.refresh((response) => {
                if (response.climate_state && response.climate_state.inside_temp != undefined)
                    callback(null, response.climate_state.inside_temp);
                else
                    callback(null);
            });

        });

        this.services.push(service);

    }

    enableBatteryLevel() {
        var service = new Service.BatteryService(this.name);

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {

            this.refresh((response) => {
                if (response.charge_state && response.charge_state.battery_level != undefined)
                    callback(null, response.charge_state.battery_level);
                else
                    callback(null);

            });

        });

        this.services.push(service);
    }

    enableHVAC() {
        var service = new Service.Fan("Fläkten");

        var getHVACState = (callback) => {

            this.refresh((response) => {
                callback(null, response.climate_state && response.climate_state.is_climate_on);
            });

        };

        var setHVACState = (value, callback) => {
            this.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return this.api.wakeUp(this.config.vin);
            })
            .then(() => {
                return this.api.setAutoConditioningState(this.config.vin, value);
            })
            .then(() => {
                callback(null, value);    
            })

            .catch((error) => {
                callback(null);
            })            
        };

        service.getCharacteristic(Characteristic.On).on('get', getHVACState.bind(this));
        service.getCharacteristic(Characteristic.On).on('set', setHVACState.bind(this));

        this.services.push(service);

    }

    enableDoorsLock() {
        var service = new Service.LockMechanism("Bildörren");

        var getLockedState = (callback) => {

            this.refresh((response) => {
                callback(null, response.vehicle_state && response.vehicle_state.locked);

            });

        };

        var setLockedState = (value, callback) => {
            this.log('Turning door lock to state %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return this.api.wakeUp(this.config.vin);
            })
            .then(() => {
                return this.api.setDoorState(this.config.vin, value);
            })
            .then(() => {
                service.setCharacteristic(Characteristic.LockCurrentState, value); 
                callback(null, value);    
            })

            .catch((error) => {
                callback(null);
            })            
        };

        service.getCharacteristic(Characteristic.LockCurrentState).on('get', getLockedState.bind(this));

        service.getCharacteristic(Characteristic.LockTargetState).on('get', getLockedState.bind(this));
        service.getCharacteristic(Characteristic.LockTargetState).on('set', setLockedState.bind(this));

        
        this.services.push(service);
    }




    enableAccessoryInfo() {
        const service = new Service.AccessoryInformation();

        service.setCharacteristic(Characteristic.Manufacturer, 'meg768');
        service.setCharacteristic(Characteristic.Model, 'Tesla');
        service.setCharacteristic(Characteristic.SerialNumber, '1.0');

        this.services.push(service);
    }

    getServices() {
        return this.services;
    }

}
