"use strict";

var Path = require('path');
var Events = require('events');

var sprintf = require('yow/sprintf');
var isString = require('yow/is').isString;
var isFunction = require('yow/is').isFunction;



module.exports = class API {

    constructor(options) {

        this.teslajs = require('teslajs');
        this.authToken = undefined;
        this.vehicleID = {};
        this.log = () => {};
        this.debug = () => {};

        if (options && isFunction(options.log))
            this.log = options.log;

        if (options && isFunction(options.debug))
            this.debug = options.debug;


    }

    getVehicleID(vin) {
        var vehicleID = this.vehicleID[vin];

        if (vehicleID == undefined)
            throw new Error('Cannot find a vehicle with VIN ' + vin);

        return vehicleID;
    }

    login() {

        if (this.authToken)
            return Promise.resolve(this.authToken);

        return new Promise((resolve, reject) => {
 
            var username = process.env.TESLA_USER;
            var password = process.env.TESLA_PASSWORD;
        
            this.teslajs.login(username, password, (error, response) => {
                if (error) {
                    reject(error);
                }
                else if (response.error) {
                    reject(new Error(response.error));
                }
                else if (response.authToken == undefined) {
                    reject(new Error('Cannot find an authToken.'));

                }
                else {
                    var authToken = response.authToken;

                    this.teslajs.vehicles({authToken: authToken}, (error, response) => {
                        if (error)
                            reject(error);
                        else {
                            response.forEach((element) => {
                                this.vehicleID[element.vin] = element.id_s;
                            });

                            resolve(this.authToken = authToken);
                        }
                    });    
        
                }
            });
    
        });
    }


    getVehicle(vin) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);

            this.teslajs.vehicle({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }

    getVehicleState(vin) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);

            this.teslajs.vehicleState({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }

    getChargeState(vin) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);

            this.teslajs.chargeState({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }


    getClimateState(vin) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);

            this.teslajs.climateState({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }

    setClimateState(vin, state) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);
            var method = state ? this.teslajs.climateStart : this.teslajs.climateStop;

            method({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }



    setDoorLockState(vin, state) {
        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);
            var method = state ? this.teslajs.doorLock : this.teslajs.doorUnlock;

            method({authToken: this.authToken, vehicleID:vehicleID}, (error, response) => {
                if (error)
                    reject(error);
                else
                    resolve(response);
            });    
        });
    }

    wakeUp(vin, timeout = 60000) {

        var now = new Date();

        var pause = (ms) => {
            return new Promise((resolve, reject) => {
                this.log('Pausing...');
                setTimeout(resolve, ms);
            });            
        };

        this.log('Calling wakeup..')
        this.teslajs.wakeUp({authToken: this.authToken, vehicleID:vehicleID});

        return new Promise((resolve, reject) => {
            var online = false;

            while (!online || Date.now() - now < timeout) {
                this.getVehicle(vin).then((response) => {
                    this.log('Checking online state...');

                    // Are we online?
                    online = response.state == 'online';

                    if (online)
                        resolve(response);

                    return pause(online ? 0 : 500); 
                })
                .catch((error) => {
                    console.log(error);
                });

            }

            if (!online) {
                reject(new Error('The Tesla cannot be reached.'));
            }

        });
    }


    wakeUpOLd(vin, timestamp) {

        var vehicleID = this.getVehicleID(vin);

        var pause = (ms) => {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, ms);
            });            
        };

        return new Promise((resolve, reject) => {

            this.getVehicle(vin).then((response) => {
                if (response.state != 'online') {

                    var now = new Date();

                    if (timestamp == undefined) {
                        timestamp = new Date();

                        this.log('State is %s, waking up...', response.state);
                        this.teslajs.wakeUp({authToken: this.authToken, vehicleID:vehicleID});
                    }
                    else {
                        this.log('Still not awake. State is %s', response.state);
                    }

                    if (now.getTime() - timestamp.getTime() < 60000) {

                        return pause(1000).then(() => {
                            this.log('wakeUp() failed, trying to wake up again...');
                            return this.wakeUp(vin, timestamp);
                        });
                    }
                    else {
                        throw new Error('The Tesla cannot be reached.');
                    }
                }
                else {
                    resolve(response);
                }
            })
            .catch((error) => {
                reject(error);
            })
        });


    }


}
