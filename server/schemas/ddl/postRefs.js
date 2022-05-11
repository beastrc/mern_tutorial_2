'use strict';
//import dependency
var rfr = require('rfr'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Schema.Types.ObjectId;

var constant = rfr('/server/shared/constant'),
  utils = rfr('/server/shared/utils');

var postRefs = new Schema({
  title: { type: String, required: true },
  practiceArea: { type: Array },
  skillsNeeded: { type: Array },
  state: { type: ObjectId },
  refDescription: { type: String ,required: true},
  userId: { type: ObjectId },
  deletedReason: { type: String },
  created_at: { type: Date, default: utils.getCurrentDate() },
  updated_at: { type: Date, default: utils.getCurrentDate() },
  posted_at: { type: Date, default: utils.getCurrentDate() },
  status:{type: Boolean, default: true},
});
postRefs.index({ title: 'text', refDescription: 'text' });

postRefs.statics.saveData = function(data, callback) {
  this.create(data, callback);
};

postRefs.statics.getRefData = function(data, callback) {
  this.findOne(data, callback);
};

postRefs.statics.findQuery = function(queryObj = {}, callback) {
  this.find(queryObj.query || {}, queryObj.options || {})
    .skip(queryObj.skip || 0)
    .limit(queryObj.limit || 0)
    .sort(queryObj.sortOption || {})
    .exec(callback);
};

postRefs.statics.deleteRef = function (id, callback) {
  this.findOneAndUpdate({ _id: id }, { $set: { status: constant['STATUS']['DELETED']} }, { upsert: false }, callback);
};

postRefs.statics.updateQuery = function(id, data, callback) {
  this.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true, upsert: false },
    callback
  );
};

postRefs.statics.getCount = function(queryObj = {}, callback) {
  this.find(queryObj.query || {})
    .count()
    .exec(callback);
};


/***
 * Author @zhu
 * get my posted referrals
 */
postRefs.statics.getPostedRefsByUserId = function(data, callback) {
  this.aggregate([
    { 
      $match: { $and: [{ userId: mongoose.Types.ObjectId(data.userId) }, {status: true}]}
    },
    {
      $lookup: {
        from: 'states',
        localField: 'state',
        foreignField: '_id',
        as: 'state_info'
      }
    },
    { $unwind: '$state_info' },
    {
      $lookup: {
        from: 'ref_statuses',
        localField: '_id',
        foreignField: 'ref_id',
        as: 'ref_status'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ref_status.user_id',
        foreignField: '_id',
        as: 'responded_users'
      }
    },
    { $sort: { posted_at: -1, _id: -1 } },
    { 
      $project: {
        'responded_users.email': 0, 
        'responded_users.password':0, 
        'responded_users.role':0, 
        'responded_users.email_verification_code':0,
      } 
    },
  ]).exec(callback);
};

/***
 * Author @zhu
 * get referrals in search page
 */
postRefs.statics.getPostedRefsAll = function(data, callback) {
  
  data.states = data.states.map(item=> mongoose.Types.ObjectId(item));
  var stateObj =
    data.states && data.states.length ? { state: { $in: data.states } } : {};
  var practiceAreasArray = _.map(data.practiceAreas, 'value');
  var areaObj =
    data.practiceAreas && data.practiceAreas.length
      ? { 'practiceArea.value': { $in: practiceAreasArray } }
      : {};
  var textSearch = data.searchKeywords.length
    ? { $match: { $text: { $search: data.searchKeywords } } }
    : { $match: {} };

  this.aggregate([
    textSearch,
    { 
      $match: { $and: [
        { userId:{$ne: mongoose.Types.ObjectId(data.userId)}}, 
        {status: true},
        areaObj,
        stateObj
      ]}
    },
    {
      $lookup: {
        from: 'states',
        localField: 'state',
        foreignField: '_id',
        as: 'state_info'
      }
    },
    { $unwind: '$state_info' },
    {
      $lookup: {
        from: 'ref_statuses',
        localField: '_id',
        foreignField: 'ref_id',
        as: 'ref_status'
      }
    },
    {
      $project: {
        _id:1,
        practiceArea:1,
        skillsNeeded:1,
        title:1,
        refDescription:1,
        posted_at:1,
        state_info:1,
        ref_status:{
            $filter: {
               input: "$ref_status",
               as: "item",
               cond: { $eq: [ "$$item.user_id", mongoose.Types.ObjectId(data.userId) ] }
            }
         }
      }
   },
   //{ $unwind: '$ref_status' },
   { $sort: { posted_at: -1, _id: -1 } },
  ]).exec(callback);
};


/***
 * Author @zhu
 * get my responded referrals
 */
postRefs.statics.getRespondedRefsAll = function(data, callback) {
  this.aggregate([
    { 
      $match: { $and: [{ userId:{$ne: mongoose.Types.ObjectId(data.userId)}}, {status: true}]}
    },
    {
      $lookup: {
        from: 'states',
        localField: 'state',
        foreignField: '_id',
        as: 'state_info'
      }
    },
    { $unwind: '$state_info' },
    {
      $lookup: {
        from: 'ref_statuses',
        localField: '_id',
        foreignField: 'ref_id',
        as: 'ref_status'
      }
    },
    {
      $project: {
        _id:1,
        practiceArea:1,
        skillsNeeded:1,
        title:1,
        refDescription:1,
        posted_at:1,
        state_info:1,
        ref_status:{
          $filter: {
              input: "$ref_status",
              as: "item",
              cond: { $eq: [ "$$item.user_id", mongoose.Types.ObjectId(data.userId) ] }
          }
        },
        sizeStatus: { $gt: [ {$size: "$ref_status" }, 1 ] },
      }
   },
   { $match: { sizeStatus : true }} ,
   { $sort: { posted_at: -1, _id: -1 } },
  ]).exec(callback);
};
postRefs.statics.getRefsByUserId = function(data, callback) {
  this.aggregate([
    { $match: { $and: [{ userId: mongoose.Types.ObjectId(data.userId) }, {status: {$in:[0, 1]}}]}},
    { $sort: { status: -1, posted_at: -1, _id: -1 } },
    { $limit: data.skip + data.limit },
    { $skip: data.skip },
    {
      $lookup: {
        from: 'Ref_statuses',
        localField: '_id',
        foreignField: 'Ref_id',
        as: 'total_applied'
      }
    },
    { $addFields: { stateId: { $toObjectId: '$state' } } },
    {
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: '_id',
        as: 'state_info'
      }
    },
    { $unwind: '$state_info' },
    {
      $addFields: {
        total_applied: {
          $map: {
            input: '$total_applied',
            as: 'st',
            in: '$$st.status'
          }
        }
      }
    }
  ]).exec(callback);
};

postRefs.statics.getCriteriaValues = function(data, callback) {
  this.aggregate([
    { 
      $match: { _id: mongoose.Types.ObjectId(data.ref_id) } 
    },
    {
      $addFields :{
        practice_values:{
          $map:{
            input: "$practiceArea",
            as: "pr",
            in: "$$pr.value",
          }
        },
        skill_values:{
          $map:{
            input: "$skillsNeeded",
            as: "sn",
            in: "$$sn.value",
          }
        },
      }
    },
    {
      $project:{
        practice_values: 1,
        skill_values:1,
        state: 1,
      }
    }
  ]).exec(callback);
};


module.exports = mongoose.model('post_Refs', postRefs);
