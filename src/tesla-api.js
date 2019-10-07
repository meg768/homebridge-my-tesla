"use strict";

var isFunction = require('yow/is').isFunction;
var Request = require('yow/request');



module.exports = class API {

    constructor(options) {

        var {vin, username = process.env.TESLA_USER, password = process.env.TESLA_PASSWORD, clientID = process.env.TESLA_CLIENT_ID, clientSecret = process.env.TESLA_CLIENT_SECRET} = options;

        if (!clientID || !clientSecret || !username || !password)
            throw new Error('Need Tesla credentials.');

        if (!vin) 
            throw new Error('Need the VIN number of your Tesla.');

        this.api          = null;
        this.vehicle      = null;
        this.vin          = vin;
        this.username     = username;
        this.password     = password;
        this.clientID     = clientID;
        this.clientSecret = clientSecret;
        this.cache        = {};
        this.requestQueue = {};
        this.token        = undefined;

        this.log = () => {};
        this.debug = () => {};

        if (options && isFunction(options.log))
            this.log = options.log;

        if (options && isFunction(options.debug))
            this.debug = options.debug;

    }

    request(method, path) {

        var key = `${method}:${path}`;
        var promise = new Promise((resolve, reject) => {
            
            if (this.requestQueue[key] == undefined)
                this.requestQueue[key] = [];

            this.requestQueue[key].push({resolve:resolve, reject:reject});

            if (this.requestQueue[key].length == 1) {
                this.log('Seding request', method, path);

                this.api.request(method, path).then((response) => {
    
                    this.log('Request completed', method, path);
                    this.debug(JSON.stringify(response, null, 4));
                    this.log('Updating', this.requestQueue[key].length, 'items');
    
                    this.requestQueue[key].forEach((request) => {
                        request.resolve(response.body.response);
                    });
                })
                .catch((error) => {
                    this.requestQueue[key].forEach((request) => {
                        request.reject(error);
                    });
                })
                .then(() => {
                    this.requestQueue[key] = [];
                });   
    
            }
       
        });


        return promise;
    }

    cachedRequest(method, path, timeout) {

        return new Promise((resolve, reject) => {
            var key = `${method}:${path}`;
            var cache = this.cache[key];
            var now = new Date();

            if (timeout && cache && (now.valueOf() - cache.timestamp.valueOf() < timeout)) {
                this.log(`Returning cached information for ${path}...`);
                resolve(cache.data);
            }
            else {
                this.request(method, path).then((result) => {
                    this.cache[key] = {timestamp:new Date(), data:result};
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                })
            }
        });
    }  

/*
    enqueue(promise) {

        this.queue.push(promise);

        if (this.queue.length == 1) {
            this.api.wakeUp(vin).then(() => {
                return this.api.getVehicleData(vin);         
            })
            .then((response) => {
                var data = new VehicleData(response);

                this.refreshQueue.forEach((callback) => {
                    callback(data);
                });

                this.log('Getting car state completed. Updated %d callbacks.', this.refreshQueue.length);
            })
            .catch((error) => {
                this.log(error);

                this.refreshQueue.forEach((callback) => {
                    callback(new VehicleData(null));
                });
            })
            .then(() => {
                this.refreshQueue = [];
            })
        }
    }
*/

    login() {
        if (this.vehicle)
            return Promise.resolve(this.vehicle);

        var defaultOptions = {
            headers: {
                "x-tesla-user-agent": "TeslaApp/3.4.4-350/fad4a582e/android/8.1.0",
                "user-agent": "Mozilla/5.0 (Linux; Android 8.1.0; Pixel XL Build/OPM4.171019.021.D1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.91 Mobile Safari/537.36",
                "content-type": "application/json; charset=utf-8"
            }
        };

        var api = new Request('https://owner-api.teslamotors.com', defaultOptions);
        var token = null;

        return new Promise((resolve, reject) => {
 
            Promise.resolve().then(() => {

                var options = {
                    body: {
                        "grant_type": "password",
                        "client_id": this.clientID,
                        "client_secret": this.clientSecret,
                        "email": this.username,
                        "password": this.password      
                    }
                }

                return api.request('POST', '/oauth/token', options);

            })
            .then((response) => {
                token = response.body;

                api.defaultOptions.headers['authorization'] = 'Bearer ' + response.body.access_token;

                return api.request('GET', '/api/1/vehicles');
            })
            .then((response) => {

                var vehicles = response.body.response;

                var vehicle = vehicles.find((item) => {
                    return item.vin == this.vin;
                });

                if (vehicle == undefined) {
                    throw new Error(`Vehicle ${this.vin} could not be found.`);
                }

                this.api = api;
                this.token = token;
                this.vehicle = vehicle;

                resolve(this.vehicle);

            })

            .catch((error) => {
                reject(error);
            });
    
        });
    }

    getVehicle() {
        return this.vehicle;
    }

    getVehicleID() {
        return this.vehicle.id_s;
    }

    wakeUp(timestamp) {

        return new Promise((resolve, reject) => {

            var vehicleID = this.getVehicleID();
            var wakeupInterval = 5 * 60000;

            var pause = (ms) => {
                return new Promise((resolve, reject) => {
                    setTimeout(resolve, ms);
                });            
            };
    
            this.cachedRequest('POST', `/api/1/vehicles/${vehicleID}/wake_up`, wakeupInterval).then((response) => {
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
                            return this.wakeUp(timestamp);
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

    getVehicleData() {
        return this.request('GET', `/api/1/vehicles/${this.getVehicleID()}/vehicle_data`);
    }

    postCommand(command) {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/${command}`);
    }

    doorLock() {
        return this.postCommand('door_lock');
    }

    doorUnlock() {
        return this.postCommand('door_unlock');
    }

    autoConditioningStart() {
        return this.postCommand('auto_conditioning_start');
    }

    autoConditioningStop() {
        return this.postCommand('auto_conditioning_stop');
    }

    chargePortDoorOpen() {
        return this.postCommand('charge_port_door_open');
    }

    chargePortDoorClose() {
        return this.postCommand('charge_port_door_close');
    }

    chargeStart() {
        return this.postCommand('charge_start');
    }

    chargeStop() {
        return this.postCommand('charge_stop');
    }

    remoteStartDrive() {
        return this.postCommand(`remote_start_drive?password=${this.password}`);
    }


}
