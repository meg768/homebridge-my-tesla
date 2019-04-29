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
        this.pushover = platform.pushover;
        this.config = config;
        this.name = config.name;
        this.uuid = platform.generateUUID(config.vin);
        this.services = [];
        this.api = platform.api;
        this.platform = platform;

        this.enableAccessoryInfo();
        this.enableDoors();
        this.enableBatteryLevel();

    }

    getVehicleState() {
        return new Promise((resolve, reject) => {

            this.getVehicle().then((vehicle) => {

                this.log('Fetching vehicle state', vehicle);

                this.api.vehicleState(vehicle, (error, response) => {

                    if (error) {
                        reject(new Error(error));
                    }
                    else    
                        resolve(response);
                })
            })
            .catch((error) => {
                this.log('GIVK INTE')
                reject(error);
            })
        })
    }

    
    enableBatteryLevel() {
        var service = new Service.BatteryService(this.name);

        service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {

            this.log('get BatteryLevel');

            this.getVehicle().then((vehicle) => {
                this.api.chargeState(vehicle, (error, response) => {

                    this.log(response);
                    if (response && response.battery_level != undefined)
                        callback(null, response.battery_level);
                    else
                        callback(null);

                })
            })
            .catch((error) => {
                this.log('Could not get battery level');
                this.log(error);
                callback(null);

            })
        });

        this.services.push(service);
    }

    enableDoors() {
        var service = new Service.LockMechanism("Bilen");

        var getLockedState = (callback) => {
            this.getVehicleState().then((state) => {
                callback(null, state.locked);
            })
            .catch((error) => {
                this.log('Could not get LockCurrentState');
                this.log(error);
                callback(null);
            })
        };

        var setLockedState = (value, callback) => {
            this.getVehicle().then((vehicle) => {

                this.log('Setting door locks to ', value);

                var method = value ? this.api.doorLock : this.api.doorUnlock;

                method(vehicle, (error, response) => {
                    this.log('setLockState response', response);
                    this.log('setLockState error', error);

                    service.setCharacteristic(Characteristic.LockCurrentState, value); 
                    callback(null, value);

                })
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



    wakeUp(vehicle) {
        return new Promise((resolve, reject) => {

            if (vehicle.state != 'asleep')
                resolve();
            else {
                var options = {};
                options.authToken = this.platform.token;
                options.vehicleID = vehicle.id_s;

                this.api.wakeUp(options, (error, response) => {

                })

            }
            this.platform.getVehicles().then((vehicles) => {

                var vehicle = vehicles.find((item) => {
                    return item.vin == this.config.vin;
                });

                if (vehicle == undefined)
                    reject(new Error('Vehicle not found.'));
                else {
                    if (vehicle.state == 'asleep') {

                    }
                }
                    resolve({authToken:this.platform.token, vehicleID:vehicle.id_s});

            })
            .catch((error) => {
                this.log(error);
                reject(error);
            })
        });
    }

    wakeUp() {

    }


    getVehicle() {
        return new Promise((resolve, reject) => {

            this.platform.getVehicles().then((vehicles) => {

                var vehicle = vehicles.find((item) => {
                    return item.vin == this.config.vin;
                });

                if (vehicle == undefined)
                    reject(new Error('Vehicle not found.'));
                else {
                    resolve({authToken:this.platform.token, vehicleID:vehicle.id_s});
                    if (vehicle.state == 'asleep') {

                    }
                }

            })
            .then(() => {
                
            })
            .catch((error) => {
                this.log(error);
                reject(error);
            })
        });
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
