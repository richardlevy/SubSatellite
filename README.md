# SubSatellite

**Note:** This version of SubSatellite has been superseded by a new Java version - https://github.com/richardlevy/SubSatelliteJava

A light-weight satellite receiver for Subsonic.  

SubSonic jukebox mode allows you to play music direct on the server hardware.  This is great if your server is hooked up to a sound system, but if it isn't then playing your SubSonic music through your sound system means installing a separate server.

SubSatellite is a lightweight SubSonic client with a cut-down SubSonic Jukebox REST API.  You can install SubSatellite on a node compatible device connected to a sound source and stream music from your existing SubSonic server. 

SubSatellite is controlled using a REST API that is based on the SubSonic Jukebox REST API.  It is recommended that you use an existing SubSonic client to control SubSatellite.

Clients with SubSatellite support are:

* AVSub (iOS) - http://www.avsubapp.co.uk

See http://www.avsubapp.co.uk/subSatellite.html for further details.

SubSatellite uses a slightly modified version of Aurora.js, which can be found here - https://github.com/richardlevy/aurora.js

## Installation

Will add soon...

### Config.js

* Configure username and password details for your SubSatellite user (see SubSonic setup)
* Configure IP address (including port) of your SubSonic server

## SubSonic Setup

* Create a user in Subsonic for SubSatellite (put these details into config.js in SubSatellite)
* Add a new transcoder (Settings > Transcoding)
  * Name = *flac audio*
  * Convert from = *mp3 ogg oga aac m4a wav wma aif aiff ape mpc shn*
  * Convert to = *flac*
  * Step 1 = *ffmpeg -i %s -f flac -*
  * **Untick** *Enable this transcoding for all existing and new players*
* Setup SubSatellite Player (Settings > Players)
  * Clone an existing player
  * Name new player *subSatellite*
  * Disable all Active transcoding **except** *flac audio*
  * Save
  * Ensure all existing players have *flac audio* transcoding disabled

You are now setup.

## REST API 0.1

```
/rest/satelliteControl.view/status
/rest/satelliteControl.view/set/{ids}
/rest/satelliteControl.view/start
/rest/satelliteControl.view/stop
/rest/satelliteControl.view/get
/rest/satelliteControl.view/skip/{index}/{offset}
/rest/satelliteControl.view/setGain/{gain}
```

## Current Limitations

This project is a minimum viable prototype.  It has the following limitations:

* Full direct support for FLAC
  * This is why everything is transcoded to FLAC in Subsonic (see SubSonic setup)
* Limited direct MP3 support (investigating this)
* Issue with pause operation (issue raised)
* Cannot seek within a file
