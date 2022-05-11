var rfr = require('rfr');
var utils = rfr('/server/shared/utils'),
subscriptionsModel = rfr('/server/models/subscriptions')

function getSubscribePlans(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.getSubscribePlans(req, res, cb);
}

function storeSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.storeSubscription(req, res, cb);
}

function getNewlySubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.getNewlySubscribedPlan(req, res, cb);
}

function cancelScheduledPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.cancelScheduledPlan(req, res, cb);
}

function getSubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.getSubscribedPlan(req, res, cb);
}

function updateSubscribedPlan(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.updateSubscribedPlan(req, res, cb);
}

function createCheckoutSession(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.createCheckoutSession(req, res, cb);
}

function createSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.createSubscription(req, res, cb);
}

function generateCheckoutNewUrl(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.generateCheckoutNewUrl(req, res, cb);
}

function generateCheckoutExistingUrl(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.generateCheckoutExistingUrl(req, res, cb);
}

function applyPromoCode(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.applyPromoCode(req, res, cb);
}

function cancelSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.cancelSubscription(req, res, cb);
}

function updateSubscription(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.updateSubscription(req, res, cb);
}

function decreaseJobCnt(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.decreaseJobCnt(req, res, cb);
}

function decreaseInviteCnt(req, res) {
  var cb = function(result) {
    utils.sendResponse(res, result);
  }
  subscriptionsModel.decreaseInviteCnt(req, res, cb);
}

module.exports = {
  applyPromoCode,
  getSubscribePlans,
  getSubscribedPlan,
  createCheckoutSession,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  generateCheckoutNewUrl,
  storeSubscription,
  generateCheckoutExistingUrl,
  updateSubscribedPlan,
  getNewlySubscribedPlan,
  cancelScheduledPlan,
  decreaseJobCnt,
  decreaseInviteCnt
}
