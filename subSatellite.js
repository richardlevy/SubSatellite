var AV = require('./lib/AV/node.js');
require('./lib/flac.js');
require('./lib/AV/mp3.js');
var express = require('express');
var app = express();
var config = require('./config.js');

var currentPlayer;
var currentPlayingIndex=0;
var nextPlayer;
var currentVolume = 75;

var fakePausePosition=0;
var isCurrentFakePaused=false;

var playlist = [];

version="0.1b";
apiVersion="0.1b";

var debug=function(msg){
  if (config.debug){
    console.log(msg);
  }
}

var info=function(msg){
  console.log(msg);
}

var resetFakePause=function(){
  fakePausePosition=0;
  isCurrentFakePaused=false;
}

var createCurrentPlayer = function (url){

  var asset = new AV.Asset.fromLimitedURL(url, config.bpsRateLimit);
  currentPlayer = new AV.Player(asset);
  currentPlayer.preload();
  currentPlayer.volume=currentVolume;

  debug('Created current player for URL ' + url);

  currentPlayer.on('buffer', function(pc){
    if (pc==100){
      debug("Finished preloading current track");
    }
  });

  currentPlayer.on('error', function(err){
    info('Error [current] = ' + err + " - recreating player");
    currentPlayer=null;
    createCurrentPlayer(makeURL(playlist[currentPlayingIndex]));
  } );

  currentPlayer.on('ready', function(){
  });

  currentPlayer.on('end', function(){
    currentTrackFinished();
  });

}

var createNextPlayer = function (url){
  return;
  debug ('Creating next player for URL ' + url);

  var asset = new AV.Asset.fromLimitedURL(url, config.bpsRateLimit);
  nextPlayer = new AV.Player(asset);

  nextPlayer.preload();
  nextPlayer.volume=currentVolume;

  nextPlayer.on('error', function(err){
    info('Error = ' + err);
  } );

  nextPlayer.on('buffer', function(pc){
    if (pc==100){
      debug("Next track buffered");
    }
  });

  nextPlayer.on('ready', function(){
  });

  nextPlayer.on('end', function(){
    currentTrackFinished();
  });

}

var currentTrackFinished = function(){
  moveToNextTrack();
}

var moveToNextTrack = function(){
  destroyCurrentPlayer();
  if (nextPlayer){
    currentPlayer = nextPlayer;
    currentPlayingIndex++;
    // Carry on playing
    currentPlayer.play();
    currentPlayer.volume=currentVolume;

    // If there's another track, queue it up
    if (Number(currentPlayingIndex)+1 < playlist.length) {
      createNextPlayer(makeURL(playlist[Number(currentPlayingIndex)+1]));
    }
  }
}

var processPause = function(){
  if (currentPlayer && currentPlayer.playing){
    if (config.fakePause){
      // fakePausePosition = currentPlayer.currentTime;
      fakePausePosition = 0;
      isCurrentFakePaused=true;
      destroyCurrentPlayer();
    } else {
      currentPlayer.pause();
    }
  }
  return createStatus();
}

var processResume = function(){
  if (config.fakePause){
      createCurrentPlayer(makeURL(playlist[currentPlayingIndex]));
      //info("Seeking to " + fakePausePosition);
      //currentPlayer.seek(fakePausePosition)
      currentPlayer.play();
      isCurrentFakePaused=false;
  } else {
    if (currentPlayer && !currentPlayer.playing){
      currentPlayer.start();
    }
  }
  return createStatus();
}

var processGain = function(gain){
  if (gain && currentPlayer){
    currentVolume = Math.floor(gain * 100);
    currentPlayer.volume=currentVolume;    
  }
  return createStatus();
}

var processSkip = function(index, offset){
  resetFakePause();
  if (index < playlist.length) {
    var nextPlayerIndex = Number(currentPlayingIndex)+1;

    // Check if it's the track that we've already queued up - i.e the next one
    if (Number(index) == nextPlayerIndex && nextPlayer && nextPlayer.buffered==100){
      destroyCurrentPlayer();
      currentPlayer=null;
      currentPlayer=nextPlayer;
      currentPlayer.play();
      currentPlayingIndex=index;
      createNextPlayer(makeURL(playlist[Number(currentPlayingIndex)+1]));
    } else {
      currentPlayingIndex=index;
      startMusic();
    }
    if (offset){
      debug("Seeking to offset - " + offset);
      //currentPlayer.seek(offset*1000);
    }

  }
  return createStatus();
}

var processGet = function() {
  var currentIndex=-1;
  var playing=false;
  var gain=1.0;
  var currentTime=0;
  if (currentPlayer){
    currentIndex=currentPlayingIndex;
    playing=currentPlayer.playing;
    gain = currentPlayer.volume/100;
    currentTime = Math.floor(currentPlayer.currentTime/1000);
  }
  var xmlResponse = '<satellitePlaylist currentIndex="'+currentIndex+'" playing="'+playing+'" gain="'+gain+'" position="'+currentTime+'">';

  playlist.forEach(function(id){
    xmlResponse += "<entry id='" + id + "'/>";
  });

  xmlResponse+="</satellitePlaylist>";

  return createResponse(xmlResponse);
}

var destroyCurrentPlayer = function(){
  debug("Destroying current");
  destroyPlayer(currentPlayer);
  currentPlayer=null;
}

var destroyPlayer = function(player){
  if (player){
    try {
      debug("Stopping/destroying");
      player.stop();      
    } catch (err){
      // console.log ("Cannot close player - probably already destroyed");
    }    
    debug ("Player destroyed");
  }
}

var startMusic = function(){
  destroyCurrentPlayer();
  createCurrentPlayer(makeURL(playlist[currentPlayingIndex]));

  currentPlayer.play();

  // If there's another track, queue it up
  if (Number(currentPlayingIndex)+1 < playlist.length) {
    createNextPlayer(makeURL(playlist[Number(currentPlayingIndex)+1]));
  } else {
    debug("Not queueing next because currentIndex+1 ["+(Number(currentPlayingIndex)+1)+"] is not < playlist length ["+playlist.length+"]");
  }
}

var processStart = function(){
  if (config.fakePause && isCurrentFakePaused){
      createCurrentPlayer(makeURL(playlist[currentPlayingIndex]));
      //debug("Seeking to " + fakePausePosition);
      //currentPlayer.seek(fakePausePosition)
      currentPlayer.play();
  } else {
   if (!currentPlayer){
      debug("Creating player");
      startMusic();    
    } else {
      debug("Starting existing player");
      currentPlayer.play();
    }
  }
  resetFakePause();
  return createStatus();
}

var makeURL = function(id){
  return config.subsonic.host + '/rest/stream.view?v=1.7.0&c=subSatellite&u=' + config.subsonic.username + '&p=' + config.subsonic.password + '&id=' + id;
}

// Set playlist
var processSet = function (id){
  resetFakePause();
  // Set initialises the playlist
  playlist=[];
  if (id.constructor == Array){
    id.forEach(function(entry){
      addToPlaylist(entry);
    });
  } else {
    addToPlaylist(id);
  }
  info ('Playlist = ' + playlist);
  destroyCurrentPlayer();
  return createStatus();
}

var addToPlaylist = function(id){
  playlist.push(id);
}

// XML Response
var createStatus = function (msgType){
  var currentIndex=-1;
  var playing=false;
  var gain=1.0;
  var currentTime=0;
  if (currentPlayer){
    currentIndex=currentPlayingIndex;
    if (config.fakePause){
      playing=!isCurrentFakePaused;
    } else {
      playing=currentPlayer.playing;
    }
    gain = currentPlayer.volume/100;
    currentTime = Math.floor(currentPlayer.currentTime/1000);
  }
  var xmlResponse = '<satelliteStatus currentIndex="'+currentIndex+'" playing="'+playing+'" gain="'+gain+'" position="'+currentTime+'"/>';
  return createResponse(xmlResponse);
}

var createResponse = function (xml){
  return '<subsatellite-response xmlns="http://www.avsubapp.co.uk/subsatellite/restapi" status="ok" version="'+ apiVersion + '">' + xml + '</subsatellite-response>';
}

var showInfo = function() {
  info("SubSatellite V" + version);
  info("==================\n");
  info("Subsonic server = " + config.subsonic.host);
  info("Rest API version = " + apiVersion);
  info("SubSatellite started and waiting on port " + config.port + "....");
}

app.get('/rest/satelliteControl.view', function(req, res) {
  var xmlResponse=null;
  if (req.query){
    var action = req.query.action;
    if (action){
      debug ("ACTION = " + action);
      if (action=='status') {
        xmlResponse = createStatus();
      } else if (action=='set'){
        xmlResponse = processSet(req.query.id);
      } else if (action=='start'){
        xmlResponse = processStart();
      } else if (action=='stop'){
        xmlResponse = processPause();
      } else if (action=='resume'){
        xmlResponse = processResume();
      } else if (action=='get'){
        xmlResponse = processGet();
      } else if (action=='skip'){
        xmlResponse = processSkip(req.query.index, req.query.offset);
      } else if (action=='setGain'){
        xmlResponse = processGain(req.query.gain);
      } else {
        debug ("Unrecognised command " + action);
      }
    }
  }
  res.type('application/xml'); // set content-type
  res.send(xmlResponse); // send text response
});

app.listen(process.env.PORT || config.port);
showInfo();
