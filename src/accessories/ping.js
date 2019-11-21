
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            requiredBatteryLevel : 50,
            timerInterval : 5,
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.pingState              = false;
        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.addService(new Service.Switch(this.name));

        this.enableOn();


        this.vehicle.on('vehicleData', (vehicleData) => {

            Promise.resolve().then(() => {
                if (this.getPingState() && (vehicleData.getBatteryLevel() < this.requiredBatteryLevel)) {
                    this.pingState = false;
                    this.log(`Battery level too low for ping to be enabled. Setting ping state to "${this.pingState ? 'ON' : 'OFF'}".`);
                    return this.updatePingState();
                }
                else   
                    return Promise.resolve();
    
            })
            .then(() => {
            })
            .catch((error) => {
                this.log(error);
            });
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getPingState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

    }

    enableOn() {
        var service = this.getService(Service.Switch);

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setPingState(value).then(() => {
                callback(null, this.getPingState());
            })
            .catch((error) => {
                callback(error);
            })
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(this.getPingState());
        });

        service.getCharacteristic(Characteristic.On).on('change', (params) => {
            this.debug(`Ping state changed to "${JSON.stringify(params)}. Current ping state is ${this.getPingState()}."!!!!!!`);
            service.getCharacteristic(Characteristic.On).updateValue(this.getPingState());
        });

    }

    updatePingState() {
        var service = this.getService(Service.Switch);
        this.debug(`Updating ping state to "${this.getPingState()}".`);
        service.getCharacteristic(Characteristic.On).setValue(this.getPingState());

        return Promise.resolve();
    }

    getPingState() {
        return this.pingState;
    }

    setPingState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.pingState != value) {
                    this.pingState = value;
                    this.debug(`Setting ping state to "${this.pingState}".`);
                    return this.pingState ? this.ping() : Promise.resolve();
                }
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                this.log(error);
                reject();
            })
        });
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
    }


}







