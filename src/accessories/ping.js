
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Switch = require('./switch.js');
var Timer = require('yow/timer');

module.exports = class extends Switch {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5,
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});


        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.vehicle.on('vehicleData', (vehicleData) => {

            if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                this.log(`Battery level too low for ping to be enabled. Turning off.`);
                this.setState(false);
            }

            this.updateState();
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

        this.on('stateChanged', () => {
            if (this.state) {
                this.ping();
            }
        });

    }
    
    ping() {
        this.debug('Ping!');
        this.vehicle.getVehicleData();     
    }




}

