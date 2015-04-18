// Generated by CoffeeScript 1.7.1
(function() {
  var AVBuffer, EventEmitter, FileSource,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('../../core/events');

  AVBuffer = require('../../core/buffer');

  FileSource = (function(_super) {
    __extends(FileSource, _super);

    function FileSource(file) {
      this.file = file;
      if (typeof FileReader === "undefined" || FileReader === null) {
        return this.emit('error', 'This browser does not have FileReader support.');
      }
      this.offset = 0;
      this.length = this.file.size;
      this.chunkSize = 1 << 20;
      this.file[this.slice = 'slice'] || this.file[this.slice = 'webkitSlice'] || this.file[this.slice = 'mozSlice'];
    }

    FileSource.prototype.start = function() {
      if (this.reader) {
        if (!this.active) {
          return this.loop();
        }
      }
      this.reader = new FileReader;
      this.active = true;
      this.reader.onload = (function(_this) {
        return function(e) {
          var buf;
          buf = new AVBuffer(new Uint8Array(e.target.result));
          _this.offset += buf.length;
          _this.emit('data', buf);
          _this.active = false;
          if (_this.offset < _this.length) {
            return _this.loop();
          }
        };
      })(this);
      this.reader.onloadend = (function(_this) {
        return function() {
          if (_this.offset === _this.length) {
            _this.emit('end');
            return _this.reader = null;
          }
        };
      })(this);
      this.reader.onerror = (function(_this) {
        return function(e) {
          return _this.emit('error', e);
        };
      })(this);
      this.reader.onprogress = (function(_this) {
        return function(e) {
          return _this.emit('progress', (_this.offset + e.loaded) / _this.length * 100);
        };
      })(this);
      return this.loop();
    };

    FileSource.prototype.loop = function() {
      var blob, endPos;
      this.active = true;
      endPos = Math.min(this.offset + this.chunkSize, this.length);
      blob = this.file[this.slice](this.offset, endPos);
      return this.reader.readAsArrayBuffer(blob);
    };

    FileSource.prototype.pause = function() {
      var _ref;
      this.active = false;
      try {
        return (_ref = this.reader) != null ? _ref.abort() : void 0;
      } catch (_error) {}
    };

    FileSource.prototype.reset = function() {
      this.pause();
      return this.offset = 0;
    };

    return FileSource;

  })(EventEmitter);

  module.exports = FileSource;

}).call(this);