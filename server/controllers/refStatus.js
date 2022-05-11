var rfr = require('rfr');

var utils = rfr('/server/shared/utils'),
  refStatusModel = rfr('/server/models/refStatus');

function updateRefStatus(req, res) {
  var cb = function (result) {
    utils.sendResponse(res, result);
  }
  refStatusModel.updateRefStatus(req, res, cb);
}


function getOneRefStatus(req, res) {
  var cb = function (result) {
    utils.sendResponse(res, result);
  }
  refStatusModel.getOneRefStatus(req, res, cb);
}

function getAll(req, res) {
  var cb = function (result) {
    utils.sendResponse(res, result);
  }
  refStatusModel.getAll(req, res, cb);
}


module.exports = {
  updateRefStatus,
  getOneRefStatus,
  getAll,
}
