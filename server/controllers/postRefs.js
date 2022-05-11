var rfr = require('rfr');

var utils = rfr('/server/shared/utils'),
  postRefModel = rfr('/server/models/postRefs');

function postRefData(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  };
  postRefModel.postRefData(req, res, cb);
}

// function getPostJobData(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.getPostJobData(req, res, cb);
// }

// function getAll(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.getAllPostJobs(req, res, cb);
// }

// function getPostJobDetails(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.getPostJobDetails(req, res, cb);
// }

function getPostRefByUserId(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  };
  postRefModel.getPostRefByUserId(req, res, cb);
}

// function getInvitablePostJobs(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.getInvitablePostJobs(req, res, cb);
// }

// function getStepData(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.getStepData(req, res, cb);
// }

// function updatePostedJobStatus(req, res) {
//   var cb = function(result) {
//     utils.sendResponse(res, result);
//   };
//   postJobModel.updateStatus(req, res, cb);
// }

module.exports = {
  postRefData,
  // getPostJobData,
  // getAll,
  // getPostJobDetails,
  getPostRefByUserId,
  // getInvitablePostJobs,
  // getStepData,
  // updatePostedJobStatus
};
