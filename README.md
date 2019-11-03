# homebridge-my-tesla

**Please note. Under construction...**

Homebridge plugin for Tesla owners. This plugin assumes you are familiar with Homebridge. 

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
                "vin": "5YJ3E7EB9KF240654",

                "username": "xxx - Your username at tesla.com",
                "password": "xxx - Your password at tesla.com",
                "clientID": "xxx - Optional, specify if you have one",
                "clientSecret": "xxx - Optional, specify if you have one",

                "charging": {
                    "comment": "Remove this entry if you do not want a button for the charging state.",
                    "name": "Laddning"
                },
                "hvac": {
                    "comment": "Remove this entry if you do not want a button for the air conditioning.",
                    "name": "Fläkten"
                },
                "locks": {
                    "comment": "Remove the this entry if you do not want a button for controlling the door locks.",
                    "name": "Dörrar"
                },
                "temperature": {
                    "comment": "Remove the this entry if you do not want to monitor temperature.",
                    "name": "Temperatur"
                }

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

## Usage

As for now, it is a good idea to create a new home in Apple's Home app. Name
the new home to the same name of your car. Then add the this accessory to the newly created home.

