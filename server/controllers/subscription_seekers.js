var rfr = require('rfr');
var utils = rfr('/server/shared/utils'),
subscriptionsSeekerModel = rfr('/server/models/subscription_seekers')

function getSubscribePlans(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.getSubscribePlans(req, res, cb);
}

function storeSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.storeSubscription(req, res, cb);
}

function getNewlySubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.getNewlySubscribedPlan(req, res, cb);
}

function cancelScheduledPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.cancelScheduledPlan(req, res, cb);
}

function getSubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.getSubscribedPlan(req, res, cb);
}

function updateSubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.updateSubscribedPlan(req, res, cb);
}

function generateCheckoutNewUrl(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.generateCheckoutNewUrl(req, res, cb);
}

function generateCheckoutExistingUrl(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.generateCheckoutExistingUrl(req, res, cb);
}

function cancelSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsSeekerModel.cancelSubscription(req, res, cb);
}

module.exports = {
  getSubscribePlans,
  getSubscribedPlan,
  cancelSubscription,
  generateCheckoutNewUrl,
  storeSubscription,
  generateCheckoutExistingUrl,
  updateSubscribedPlan,
  getNewlySubscribedPlan,
  cancelScheduledPlan
}
