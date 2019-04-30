"use strict";
var Path = require('path');

// Load .env
require('dotenv').config({
    path: Path.join(process.env.HOME, '.homebridge/.env')
});


var API = require('./src/api.js');
var api = new API({log:console.log});
var vin = "5YJ3E7EB9KF240654";

api.login().then((authToken) => {
    console.log('Token', authToken);
})
.then(() => {
    return api.getVehicle(vin);
})
.then((vehicle) => {
    return api.wakeUp(vehicle.vin);
})
.then((vehicle) => {
    console.log('------------------------------------------------------');
    console.log('Vehicle:');
    console.log(vehicle);
    console.log('------------------------------------------------------');
    console.log('Getting vehicle state for VIN', vehicle.vin);
    return api.getVehicleState(vehicle.vin);
})
.then((state) => {
    console.log('------------------------------------------------------');
    console.log('Vehicle state:');
    console.log(state);
    console.log('------------------------------------------------------');
    console.log('Getting charge state');
    return api.getChargeState(vin);
})
.then((state) => {
    console.log('------------------------------------------------------');
    console.log('Charge state:');
    console.log(state);
    console.log('------------------------------------------------------');
    return api.getClimateState(vin)
})
.then((state) => {
    console.log('------------------------------------------------------');
    console.log('Climate state:');
    console.log(state);
    console.log('------------------------------------------------------');
})
.then(() => {
    console.log('Done.');
})
.catch((error) => {
    console.log(error.stack);
})
