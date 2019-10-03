# homebridge-my-tesla
Homebridge plugin for Tesla owners


## Installation

First, install Homebridge. See https://www.npmjs.com/package/homebridge
for more information.

Then install this plugin.

    $ sudo npm install homebridge-my-tesla -g

If you are having permission problems during install, try this

    $ sudo npm install homebridge-my-tesla -g --unsafe-perm

## Configuration File

Configure your **~/.homebridge/config.json** with the following platform.

```javascript

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
            {         
                "name": "Model 3",       
                "vin": "5YJ3E7EB9KF240654"



            }
        ]
    }]

}

```

If you already have a configuration file just add this to the **platforms** section.

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


## What This Plugin Does

This plugin simply extracts all lightbulbs, outlets and blinds currently in use by the IKEA Trådfri
Gateway and exposes them to HomeKit and you have the ability to turn the
devices on or off. And, of course, you may change the device names and
group them into rooms on your iPhone or iPad.

The following IKEA devices are supported

- Standard white bulbs
- RGB bulbs
- Warm white bulbs with temperature control
- Outlets
- Blinds

After this, start **homebridge**, scan the presented code with your iPhone, and hopefully
you will se all you IKEA lightbulbs in your iPhone/iPad Home app.

## To Do

* Support motion sensors and remote controls if possible
* Handle reboot or connection break of gateway

## Bugfixes/Updates

* 2018-01-29 - Can now have accessories with the same name in the IKEA app
* 2018-02-04 - Updated to work with gateway version 1.3.14.
               The security code must now be present in **~/.homebrige/config.json**.
* 2019-01-19 - Added support for outlets.
* 2019-08-19 - Added support for blinds.
* 2019-08-25 - Added support for auto detecting the IKEA gateway. 
               The **host** property in **~/.homebridge/config.json** is no longer required.

## Useful Links

* https://www.reddit.com/r/tradfri/
