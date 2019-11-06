"use strict";
var Path = require('path');

// Load .env
require('dotenv').config();


var vin = "5YJ3E7EB9KF240654";
var API = require('./src/tesla-api.js');
var api = new API({vin:vin, debug:console.log, log:console.log});

Promise.resolve().then(() => {
    console.log('Calling login()');
    return api.login();
})
.then(() => {
    console.log('Calling wakeup()');
    return api.wakeUp();
})
.then((response) => {
    console.log('Calling getVehicleData()');
    return api.getVehicleData();
})
.then(() => {
    console.log('Done.');
})
.catch((error) => {
    console.log(error.stack);
})



