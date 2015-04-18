// Generated by CoffeeScript 1.7.1
(function() {
  var Asset, AudioDevice, BalanceFilter, EventEmitter, Player, Queue, VolumeFilter,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('./core/events');

  Asset = require('./asset');

  VolumeFilter = require('./filters/volume');

  BalanceFilter = require('./filters/balance');

  Queue = require('./queue');

  AudioDevice = require('./device');

  Player = (function(_super) {
    __extends(Player, _super);

    function Player(asset) {
      this.asset = asset;
      this.startPlaying = __bind(this.startPlaying, this);
      this.playing = false;
      this.buffered = 0;
      this.currentTime = 0;
      this.duration = 0;
      this.volume = 100;
      this.pan = 0;
      this.metadata = {};
      this.filters = [new VolumeFilter(this, 'volume'), new BalanceFilter(this, 'pan')];
      this.asset.on('buffer', (function(_this) {
        return function(buffered) {
          _this.buffered = buffered;
          return _this.emit('buffer', _this.buffered);
        };
      })(this));
      this.asset.on('decodeStart', (function(_this) {
        return function() {
          _this.queue = new Queue(_this.asset);
          return _this.queue.once('ready', _this.startPlaying);
        };
      })(this));
      this.asset.on('format', (function(_this) {
        return function(format) {
          _this.format = format;
          return _this.emit('format', _this.format);
        };
      })(this));
      this.asset.on('metadata', (function(_this) {
        return function(metadata) {
          _this.metadata = metadata;
          return _this.emit('metadata', _this.metadata);
        };
      })(this));
      this.asset.on('duration', (function(_this) {
        return function(duration) {
          _this.duration = duration;
          return _this.emit('duration', _this.duration);
        };
      })(this));
      this.asset.on('error', (function(_this) {
        return function(error) {
          return _this.emit('error', error);
        };
      })(this));
    }

    Player.fromURL = function(url) {
      return new Player(Asset.fromURL(url));
    };

    Player.fromFile = function(file) {
      return new Player(Asset.fromFile(file));
    };

    Player.fromBuffer = function(buffer) {
      return new Player(Asset.fromBuffer(buffer));
    };

    Player.prototype.preload = function() {
      if (!this.asset) {
        return;
      }
      this.startedPreloading = true;
      return this.asset.start(false);
    };

    Player.prototype.play = function() {
      var _ref;
      if (this.playing) {
        return;
      }
      if (!this.startedPreloading) {
        this.preload();
      }
      this.playing = true;
      return (_ref = this.device) != null ? _ref.start() : void 0;
    };

    Player.prototype.pause = function() {
      var _ref;
      if (!this.playing) {
        return;
      }
      this.playing = false;
      return (_ref = this.device) != null ? _ref.stop() : void 0;
    };

    Player.prototype.togglePlayback = function() {
      if (this.playing) {
        return this.pause();
      } else {
        return this.play();
      }
    };

    Player.prototype.stop = function() {
      var _ref;
      this.pause();
      this.asset.stop();
      return (_ref = this.device) != null ? _ref.destroy() : void 0;
    };

    Player.prototype.seek = function(timestamp) {
      var _ref;
      if ((_ref = this.device) != null) {
        _ref.stop();
      }
      this.queue.once('ready', (function(_this) {
        return function() {
          var _ref1, _ref2;
          if ((_ref1 = _this.device) != null) {
            _ref1.seek(_this.currentTime);
          }
          if (_this.playing) {
            return (_ref2 = _this.device) != null ? _ref2.start() : void 0;
          }
        };
      })(this));
      timestamp = (timestamp / 1000) * this.format.sampleRate;
      timestamp = this.asset.decoder.seek(timestamp);
      this.currentTime = timestamp / this.format.sampleRate * 1000 | 0;
      this.queue.reset();
      return this.currentTime;
    };

    Player.prototype.startPlaying = function() {
      var frame, frameOffset;
      frame = this.queue.read();
      frameOffset = 0;
      this.device = new AudioDevice(this.format.sampleRate, this.format.channelsPerFrame);
      this.device.on('timeUpdate', (function(_this) {
        return function(currentTime) {
          _this.currentTime = currentTime;
          return _this.emit('progress', _this.currentTime);
        };
      })(this));
      this.refill = (function(_this) {
        return function(buffer) {
          var bufferOffset, filter, i, max, _i, _j, _len, _ref;
          if (!_this.playing) {
            return;
          }
          if (!frame) {
            frame = _this.queue.read();
            frameOffset = 0;
          }
          bufferOffset = 0;
          while (frame && bufferOffset < buffer.length) {
            max = Math.min(frame.length - frameOffset, buffer.length - bufferOffset);
            for (i = _i = 0; _i < max; i = _i += 1) {
              buffer[bufferOffset++] = frame[frameOffset++];
            }
            if (frameOffset === frame.length) {
              frame = _this.queue.read();
              frameOffset = 0;
            }
          }
          _ref = _this.filters;
          for (_j = 0, _len = _ref.length; _j < _len; _j++) {
            filter = _ref[_j];
            filter.process(buffer);
          }
          if (!frame) {
            if (_this.queue.ended) {
              _this.currentTime = _this.duration;
              _this.emit('progress', _this.currentTime);
              _this.emit('end');
              _this.stop();
            } else {
              _this.device.stop();
            }
          }
        };
      })(this);
      this.device.on('refill', this.refill);
      if (this.playing) {
        this.device.start();
      }
      return this.emit('ready');
    };

    return Player;

  })(EventEmitter);

  module.exports = Player;

}).call(this);