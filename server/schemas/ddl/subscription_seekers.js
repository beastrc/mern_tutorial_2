'use strict';
//import dependency
var rfr = require('rfr'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  utils = rfr('/server/shared/utils'),
  ObjectId = mongoose.Schema.Types.ObjectId;

var subscription_seekers = new Schema({
  customer_id: { type: String },
  email: {type: String},
  subscription_id: { type: String },
  status: { type: String },
  plan_id: { type: String },
  plan_unit_price: { type: Number },
  created_at: { type: Number },
  started_at: { type: Number },
  activated_at: { type: Number },
  updated_at: { type: Number },
  cancelled_at: { type: Number },
  cancelled_reason: { type: String },
  deleted: { type: Boolean, default: false},
  has_scheduled_changes: { type: Boolean, default: false},
  currency_code: { type: String },
  subscribe_level: { type: Number, default: 0 }
});

module.exports = mongoose.model('subscription_seekers', subscription_seekers);
