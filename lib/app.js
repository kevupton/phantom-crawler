"use strict";

var express = _interopRequireWildcard(require("express"));

var _index = require("./routes/index");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Application = function Application() {
  _classCallCheck(this, Application);

  this.app = (0, express)();
  var port = process.env.PORT || 3000;
  (0, _index.loadRoutes)(this.app);
  this.app.listen(port, function () {
    return "App listening on port ".concat(port);
  });
};

new Application();
