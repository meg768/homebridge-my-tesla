# homebridge-my-tesla

**Please note. Under construction...**

Homebridge plugin for Tesla owners. This plugin assumes you are familiar with Homebridge. 

![](images/bob.jpg?raw=true)

## Installation

First, install Homebridge. See https://www.npmjs.com/package/homebridge
for more information.

Then install this plugin.

    $ sudo npm install homebridge-my-tesla -g --unsafe-perm


## Configuration File

Configure your **~/.homebridge/config.json** with the following platform.

```json

{
    "bridge": {
        "name": "Tesla",
        "username": "11:11:11:11:11:16",
        "port": 51821,
        "pin": "111-11-116"
    },

    "description": "Sample configuration file",

    "platforms": [{
        "platform": "Tesla",
        "name": "Tesla",
        "debug": false,
        "vehicles": [
        {         
            "name": "Model 3",       
            "vin": "5YJ3E7EB9KF240655",

            "username": "Your username at tesla.com",
            "password": "Your password at tesla.com",
        }
    ]
    }]
}

```

Of course, you have to supply your own name and **VIN** number and login credentials.


## What This Plugin Does

This plugin adds a number of controls to Apple HomeKit. Currently
it only adds controls to open the doors, control the HVAC and to display current temperature.

## Siri

If you name things correctly you might get Siri to work by saying "Lock car", "Unlock car", "Turn on fan" or "Turn off fan"...

## Localize

By default, all the features (or buttons) available are added to the Home app automatically. 
Each feature has its own name and you may control each feature seperately since each 
feature has its own configuration. Default values are displayed below, you may change them as you wish.

```json

    "platforms": [{
        "platform": "Tesla",
        "name": "Tesla",
        "debug": true,
        "vehicles": [
        {         
            "vin": "5YJ3E7EB9KF240654",
            "username": "Replace with your username at tesla.com",
            "password": "Replace with your password at tesla.com",

            "accessories": {
                "ping": {
                    "name": "Ping",
                    "requiredBatteryLevel": 40,
                    "timerInterval": 5,
                    "enabled": true
                },
                "charging": {
                    "name": "Laddning",
                    "enabled": true
                },
                "hvac": {
                    "name": "Fläkten",
                    "requiredBatteryLevel": 20,
                    "enabled": true
                },
                "doors": {
                    "name": "Dörren",
                    "enabled": true
                },
                "outsideTemperature": {
                    "name": "Ute",
                    "enabled": true
                },
                "insideTemperature": {
                    "name": "Inne",
                    "enabled": true
                },
                "thermostat": {
                    "name": "Termostat",
                    "requiredBatteryLevel": 40,
                    "timerInterval": 2,
                    "enabled": true
                }
            }
        }
    ]
```

## Usage

As for now, it is a good idea to create a new home in Apple's Home app. Name
the new home to the same name of your car. Then add the this accessory to the newly created home.


## Updates

- **2019-11-15** - Accessory information updated properly with serial number (VIN) and firmware version.

