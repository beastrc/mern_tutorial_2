'use strict';
//import dependency
var rfr = require('rfr'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var constant = rfr('/server/shared/constant'),
  utils = rfr('/server/shared/utils');

var jobTypes = new Schema({
  name: { type: String },
  label: { type: String },
  status: { type: Number, default: constant['STATUS']['ACTIVE'] },
  created_at: { type: Date, default: utils.getCurrentDate() },
  updated_at: { type: Date, default: utils.getCurrentDate() }
});

jobTypes.statics.findQuery = function(obj = {}, callback) {
  this.find(obj.query || {}, obj.projection || {})
    .sort(obj.sortOption || {})
    .exec(callback);
};

module.exports = mongoose.model('job_types', jobTypes);
