// Generated by CoffeeScript 1.7.1
(function() {
  var UnderflowError,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  UnderflowError = (function(_super) {
    __extends(UnderflowError, _super);

    function UnderflowError() {
      UnderflowError.__super__.constructor.apply(this, arguments);
      this.name = 'UnderflowError';
      this.stack = new Error().stack;
    }

    return UnderflowError;

  })(Error);

  module.exports = UnderflowError;

}).call(this);
