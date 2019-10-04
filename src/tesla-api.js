"use strict";

var isFunction = require('yow/is').isFunction;
var Request = require('yow/request');



module.exports = class API {

    constructor(options) {

        var defaultOptions = {
            headers: {
                "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0",
                "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36",
                "content-type": "application/json; charset=utf-8"
            }
        };

        this.accessToken = undefined;
        this.vehicleID = {};
        this.log = () => {};
        this.debug = () => {};
        this.api = new Request('https://owner-api.teslamotors.com', defaultOptions);

        if (options && isFunction(options.log))
            this.log = options.log;

        if (options && isFunction(options.debug))
            this.debug = options.debug;


    }

    request(method, path, options) {
        return new Promise((resolve, reject) => {

            this.log('Seding request', method, path);
            this.api.request(method, path, options).then((response) => {
                this.debug(JSON.stringify(response, null, 4));
                resolve(response.body.response);
            })
            .catch((error) => {
                reject(error);
            });   

        });

    }

    getVehicleID(vin) {
        var vehicleID = this.vehicleID[vin];

        if (vehicleID == undefined)
            throw new Error('Cannot find a vehicle with VIN ' + vin);

        return vehicleID;
    }

    login() {

        if (this.accessToken)
            return Promise.resolve(this.accessToken);

        return new Promise((resolve, reject) => {
 
            var username = process.env.TESLA_USER;
            var password = process.env.TESLA_PASSWORD;
            var teslaClientID = process.env.TESLA_CLIENT_ID;
            var teslaClientSecret = process.env.TESLA_CLIENT_SECRET;

            var accessToken = undefined;

            Promise.resolve().then(() => {

                if (!teslaClientID || !teslaClientSecret)
                    throw new Error('Need Tesla credentials.');

                var options = {
                    body: {
                        "grant_type": "password",
                        "client_id": teslaClientID,
                        "client_secret": teslaClientSecret,
                        "email": username,
                        "password": password      
                    }
                }

                return this.api.request('POST', '/oauth/token', options);

            })
            .then((response) => {
                accessToken = response.body.access_token;

                this.api.defaultOptions.headers['authorization'] = 'Bearer ' + accessToken;

                return this.api.request('GET', '/api/1/vehicles');
            })
            .then((response) => {

                var vehicles = response.body.response;

                vehicles.forEach((vehicle) => {
                    this.vehicleID[vehicle.vin] = vehicle.id_s;
                });

                this.accessToken = accessToken;

                resolve(this.accessToken = accessToken);

            })

            .catch((error) => {
                reject(error);
            });
    
        });
    }

    getVehicle(vin, wakeup) {
        if (wakeup)
            return this.wakeUp(vin);

        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID(vin);

            this.api.request('GET', `/api/1/vehicles/${vehicleID}`).then((response) => {
                resolve(response.body.response);
            })

            .catch((error) => {
                reject(error);
            });   
        });
    }


    wakeUp(vin, timestamp) {

        var vehicleID = this.getVehicleID(vin);

        var pause = (ms) => {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, ms);
            });            
        };

        var tryToWakeUp = () => {

            return new Promise((resolve, reject) => {
    
                this.api.request('POST', `/api/1/vehicles/${vehicleID}/wake_up`).then((response) => {
                    resolve(response.body.response);
                })
                .catch((error) => {
                    reject(error);
                });   
            });
        }        

        return new Promise((resolve, reject) => {

            tryToWakeUp(vin).then((response) => {
                if (response.state != 'online') {

                    var now = new Date();

                    if (timestamp == undefined) {
                        timestamp = new Date();

                        this.log('State is %s, waking up...', response.state);
                    }
                    else {
                        this.log('Still not awake. State is now %s', response.state);
                    }

                    if (now.getTime() - timestamp.getTime() < 60000 * 2) {

                        pause(5000).then(() => {
                            this.log('wakeUp() failed, trying to wake up again...');
                            return this.wakeUp(vin, timestamp);
                        })
                        .then((response) => {
                            resolve(response);
                        })
                        .catch((error) => {
                            reject(error);
                        })
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

    getVehicleData(vin) {
        var vehicleID = this.getVehicleID(vin);
        var path = `/api/1/vehicles/${vehicleID}/vehicle_data`;

        return this.request('GET', path);

    }

    postCommand(vin, command) {
        var vehicleID = this.getVehicleID(vin);
        var path = `/api/1/vehicles/${vehicleID}/command/${command}`;
        return this.request('POST', path);

    }

    doorLock(vin) {
        return this.postCommand(vin, 'door_lock');
    }

    doorUnlock(vin) {
        return this.postCommand(vin, 'door_unlock');
    }

    autoConditioningStart(vin) {
        return this.postCommand(vin, 'auto_conditioning_start');
    }

    autoConditioningStop(vin) {
        return this.postCommand(vin, 'auto_conditioning_stop');
    }

    chargePortDoorOpen(vin) {
        return this.postCommand(vin, 'charge_port_door_open');
    }

    chargePortDoorClose(vin) {
        return this.postCommand(vin, 'charge_port_door_close');
    }

    chargeStart(vin) {
        return this.postCommand(vin, 'charge_start');
    }

    chargeStop(vin) {
        return this.postCommand(vin, 'charge_stop');
    }

    remoteStartDrive(vin) {
        return this.postCommand(vin, `remote_start_drive?password=${process.env.TESLA_PASSWORD}`);
    }


}
