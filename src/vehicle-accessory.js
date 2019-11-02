var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        var {vehicle, ...options} = options;

        if (vehicle == undefined)
            throw new Error('A vehicle must be specified');

        super(options);

        this.vehicle = vehicle;
        this.log = vehicle.log;
        this.debug = vehicle.debug;
        this.platform = vehicle.platform;
        this.api = vehicle.api;
    }

};

