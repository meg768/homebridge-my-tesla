# homebridge-my-tesla

Homebridge plugin for Tesla owners. This plugin assumes you are familiar with Homebridge. 

**Note: Currently under construction...**

## Installation

First, install Homebridge. See https://www.npmjs.com/package/homebridge
for more information.

Then install this plugin.

    $ sudo npm install homebridge-my-tesla -g

If you are having permission problems during install, try this

    $ sudo npm install homebridge-my-tesla -g --unsafe-perm

## Configuration File

Configure your **~/.homebridge/config.json** with the following platform.

```json
{
    "bridge": {
        "name": "Tesla",
        "username": "AD:27:3E:E4:CF:63",
        "port": 51826,
        "pin": "046-12-347"
    },

    "description": "Sample configuration file",

    "platforms": [{
        "platform": "Tesla",
        "name": "Tesla",
        "debug": false,
        "teslas": [
            {"name": "Model 3", "vin": "5YJ3E7EB9KF240654"}
        ]
    }]
}
```

If you already have a configuration file just add this to the **platforms**
 section.

```json
{
    "platform": "Tesla",
    "name": "Tesla",
    "debug": false,
    "teslas": [
        {"name": "Model 3", "vin": "5YJ3E7EB9KF240654"}
    ]

}

```
Of course, you have to supply your own name and **VIN** number.


## What This Plugin Does

This plugin adds a number of controls to Apple HomeKit. Currently
it only adds controls to open the doors, control the HVAC and to display current temperature.

As for now, it is only intended for Swedish users...

![alt text](./images/bob.jpeg){width=50%}

## Bugfixes/Updates
* None so far

## Useful Links
* Nothing yet
