var isFunction = require('yow/isFunction');
var isDate = require('yow/isDate');
var isString = require('yow/isString');
var Request = require('yow/request');
var Events = require('events');
var VehicleData = require('./vehicle-data.js');

module.exports = class TeslaAPI extends Events {

    constructor(options) {

        options = options || {};

        super();

        var {vin = process.env.TESLA_VIN, username = process.env.TESLA_USER, password = process.env.TESLA_PASSWORD, clientID = process.env.TESLA_CLIENT_ID, clientSecret = process.env.TESLA_CLIENT_SECRET} = options;

        if (clientID == undefined || (isString(clientID) && clientID.length == 0))
            clientID = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';
        
        if (clientSecret == undefined || (isString(clientSecret) && clientSecret.length == 0))
            clientSecret = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';

        if (!username)
            throw new Error('Need Tesla credentials. A username must be specified');

        if (!password)
            throw new Error('Need Tesla credentials. A password must be specified');

        if (!clientID)
            throw new Error('Need Tesla credentials. A clientID must be specified');
        
            if (!clientSecret)
            throw new Error('Need Tesla credentials. A clientSecret must be specified');

        if (!vin) 
            throw new Error('Need the VIN number of your Tesla.');

        this.api          = null;
        this.vehicle      = null;
        this.vin          = vin;
        this.username     = username;
        this.password     = password;
        this.clientID     = clientID;
        this.clientSecret = clientSecret;
        this.requests     = {};
        this.lastResponse = null;
        this.log          = isFunction(options.log) ? options.log : (options.log ? console.log : () => {});
        this.debug        = isFunction(options.debug) ? options.debug : (options.debug ? console.debug : () => {});
    }

    getVehicle() {
        return this.vehicle;
    }

    getVehicleID() {
        return this.vehicle.id_s;
    }

    isOnline() {
        return this.vehicle;
    }

    login() {
        if (this.vehicle)
            return Promise.resolve(this.vehicle);

        var defaultOptions = {
            debug: false,
            timeout: 2 * 60000,
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
                this.vehicle = vehicle;
                this.lastResponse = null;

                resolve(this.vehicle);

            })

            .catch((error) => {
                reject(error);
            });
    
        });
    }


    rawRequest(method, path) {

        return new Promise((resolve, reject) => {
            var key = `${method} ${path}`;
            this.log(`${key}...`);

            this.api.request(method, path).then((response) => {
                // Mask out the important stuff... 
                response = response.body.response;

                this.lastResponse = new Date();

                this.log(`${key} completed...`);

                resolve(response);
            })
            .catch((error) => {
                reject(error);
            })

        });
    };

    queuedRequest(method, path) {

        return new Promise((resolve, reject) => {
            var key = `${method} ${path}`;

            if (this.requests[key] == undefined)
                this.requests[key] = [];

            this.requests[key].push({resolve:resolve, reject:reject});
    
            if (this.requests[key].length == 1) {
                this.rawRequest(method, path).then((response) => {

                    this.requests[key].forEach((request) => {
                        request.resolve(response);
                    });
                })
                .catch((error) => {
                    this.requests[key].forEach((request) => {
                        request.reject(error);
                    });
                })
                .then(() => {
                    this.requests[key] = [];
                });
            }
        });
    };


    request(method, path) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                return this.wakeUp();
            })
            .then(() => {
                return this.queuedRequest(method, path);
            })
            .then((response) => {
                resolve(response);                
            })
            .catch((error) => {
                reject(error);
            })
        });

    }


    wakeUp() {
        var STATE_ONLINE = 'online';

        // Call wakeUp() if not done within last x minutes
        var wakeupInterval = 7 * 60000;

        // Keep calling wakeUp() for x minutes if no reply
        var wakeupTimeout = 2 * 60000;

        var now = new Date();

        // Check if called with in reasonable time
        if (this.lastResponse && isDate(this.lastResponse) && (now.valueOf() - this.lastResponse.valueOf() < wakeupInterval)) {
            return Promise.resolve(this.lastResponse);
        }

        var pause = (ms) => {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, ms);
            });            
        };

        var wakeUp = (timestamp) => {
            return new Promise((resolve, reject) => {

                Promise.resolve().then(() => {
                    return this.queuedRequest('POST', `/api/1/vehicles/${this.getVehicleID()}/wake_up`);
                })
                .then((response) => {
                    var pauseTime = 500;

                    if (response.state == STATE_ONLINE)
                        return Promise.resolve(response);

                    // Tesla is not online. Reset lastResponse value.
                    this.lastResponse = null;

                    this.debug(`Current state is "${response.state}". Must be "${STATE_ONLINE}" to continue. Pausing for ${pauseTime} ms and will try again...`);
    
                    return pause(pauseTime).then(() => {
                        return Promise.resolve(response);
                    });
                })
                .then((response) => {
                    var now = new Date();
    
                    if (response.state == STATE_ONLINE)
                        return Promise.resolve();
    
                    if (timestamp && now.getTime() - timestamp.getTime() > wakeupTimeout)
                        throw new Error('The Tesla cannot be reached within timeout period.');
    
                    this.debug(`State is now "${response.state}", trying to wake up...`);
    
                    return wakeUp(now).then(() => {
                        if (timestamp == undefined) {
                            // Only pause on first wakeUp() call
                            this.debug('wakeUp() succeeded. Delaying a bit after a hard sleep...');
                            return pause(4000);    
                        }
                        else
                            return pause(0);
                    });
                })
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    reject(error);
                })
    
            });
        };

        return new Promise((resolve, reject) => {
            wakeUp().then(() => {
                resolve(this.lastResponse = new Date());
            })
            .catch(() => {
                reject(error);
            });
        })


    }


    getVehicleData() {
        return new Promise((resolve, reject) => {
            this.request('GET', `/api/1/vehicles/${this.getVehicleID()}/vehicle_data`).then((response) => {
                var vehicleData = new VehicleData(response);
                this.emit('vehicleData', vehicleData);

                resolve(vehicleData);
            })
            .catch((error) => {
                reject(error);
            });

        });
    }

    doorLock() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/door_lock`);
    }

    doorUnlock() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/door_unlock`);
    }

    autoConditioningStart() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/auto_conditioning_start`);
    }

    autoConditioningStop() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/auto_conditioning_stop`);
    }

    chargePortDoorOpen() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_port_door_open`);
    }

    chargePortDoorClose() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_port_door_close`);
    }

    chargeStart() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_start`);
    }

    chargeStop() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/charge_stop`);
    }

    remoteStartDrive() {
        return this.request('POST', `/api/1/vehicles/${this.getVehicleID()}/command/remote_start_drive?password=${this.password}`);
    }


}
