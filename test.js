"use strict";
var Path = require('path');

// Load .env
require('dotenv').config();


var vin = "5YJ3E7EB9KF240654";
var API = require('./src/tesla-api.js');
var api = new API({vin:vin, debug:console.log, log:console.log});

api.login().then((token) => {
    console.log('Token', token);
})
.then(() => {
    console.log('Waking up');
    return api.wakeUp();
})
.then(() => {
    console.log('Gettings vehicle data');
    return api.getVehicleData();
})
.then((data) => {
    console.log(data);
})
.then(() => {
    console.log('Gettings vehicle data');
    return api.getVehicleData();
})
.then((data) => {
    console.log(data);
})
.then(() => {
    return api.autoConditioningStart();
})
.then(() => {
    console.log('Done.');
})
.catch((error) => {
    console.log(error.stack);
})



