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
    return api.getVehicleData(vehicle.vin);
})
.then((data) => {
    console.log(data);
})
.then(() => {
    return api.setAutoConditioningState(vin, true);
})
.then(() => {
    console.log('Done.');
})
.catch((error) => {
    console.log(error.stack);
})



