'use strict';
//import dependency
var rfr = require('rfr'),
  bcrypt = require('bcrypt'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = mongoose.Schema.Types.ObjectId;

var config = rfr('/server/shared/config'),
  constant = rfr('/server/shared/constant'),
  utils = rfr('/server/shared/utils');

//create new instance of the mongoose.schema. the schema takes an object that shows
//the shape of your database entries.
var users = new Schema({
  first_name: { type: String, required: true, maxlength: 50 },
  last_name: { type: String, required: true, maxlength: 50 },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  code: { type: String},
  is_bar_id_valid: { type: String, default: 'Yes' },
  is_email_verified: { type: Boolean, default: false },
  email_verification_code: { type: String, default: '' },
  freeze_activity: { type: Boolean, default: false },
  availability_type: { type: Number, default: 4 },
  my_network: {type: Array, default: []},
  job_seeker_info: {
    basic_profile: {
      basic_info: {
        street_address: { type: String, default: '' },
        city: { type: String, default: '' },
        state_id: { type: String, default: '' },
        zipcode: { type: String, default: '' },
        phone_number: { type: String, default: '' },
      },
      education: [
        {
          school: { type: String, default: '' },
          degree_id: { type: String, default: '' },
          degree_others: { type: String, default: '' },
          year: { type: String, default: '' },
          education_additional_information: { type: String, default: '' }
        }
      ],
      bar_admission: [
        {
          bar_state_id: { type: String, default: '' },
          bar_registration_number: { type: String, uppercase: true, default: null }
        }
      ],
      practice_area_id: { type: Array },
      skill_used_id: { type: Array },
      others: { type: String },
      showOthers: { type: String },
      present: { type: String },
      do_you_have_malpractice_insurance: { type: String, default: 'N' }
    },
    experience: [
      {
        company_name: { type: String, default: '' },
        designation: { type: String, default: '' },
        current_employer: { type: String, default: '' },
        start_date: { type: String },
        end_date: { type: String },
        employment_type_id: { type: Array },
        skill_used_id: { type: Array },
        experience_additional_information: { type: String },
        others: { type: String },
        showOthers: { type: String },
        present: { type: String }
      }
    ],
    network: {
      photo: { type: String },
      lawyer_headline: { type: String, default: '' },
      about_lawyer: { type: String, default: '' },
      linkedin_link: { type: String, default: '' },
      resume: { type: String },
      writing_samples: { type: Array },
    },
    job_profile: {
      willing_to_work_locally: { type: String, default: 'Y' },
      willing_to_work_location_id: { type: Array },
      willing_to_work_remotely: { type: String },
      willing_to_work_full_time: { type: String },
      willing_to_work_part_time: { type: String },
      desired_job_type: [
        {
          employment_type_id: { type: String },
          min_amount: { type: Number },
          max_amount: { type: Number },
          selected: { type: String }
        }
      ]
    },
    is_profile_completed: { type: String, default: 'N' },
    last_visited_page: { type: Number, default: 0 },
    is_premium: { type: Number, default: 1},
    is_referral: { type: Number, default: 1 }
  },
  job_posters_info: {
    basic_profile: {
      basic_info: {
        street_address: { type: String, default: '' },
        city: { type: String, default: '' },
        state_id: { type: String, default: '' },
        zipcode: { type: String, default: '' },
        phone_number: { type: String, default: '' },
      },
      firm_name: { type: String },
      title: { type: String },
      practice_location_id: { type: Array },
      practice_area_id: { type: Array },
      intrested_in_id: { type: Array },
      website_url: { type: String },
      bar_admission: [
        {
          bar_state_id: { type: String, default: '' },
          bar_registration_number: { type: String, uppercase: true, default: null }
        }
      ],
    },
    is_profile_completed: { type: String, default: 'N' },
    last_visited_page: { type: Number, default: 0 },
  },
  last_visited_profile: { type: String, default: "job_seeker_info" },
  forgot_pass: {
    token: { type: String },
    created_at: { type: Date, default: null }
  },
  role: { type: String, default: 'user' },
  status: { type: Number, default: constant['STATUS']['ACTIVE'] },
  deleted_reason: { type: String },
  created_at: { type: Date, default: utils.getCurrentDate() },
  updated_at: { type: Date, default: utils.getCurrentDate() }
});

users.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.hash(user.password, config.saltRounds, function (err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

users.statics.signupUser = function (data, callback) {
  this.create(data, callback);
};

users.statics.signupAttorney = function (data, callback) {
  const saveData = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: data.password,
    job_seeker_info: data.job_seeker_info,
    is_email_verified: true
  }

  this.create(saveData, callback);
};

users.statics.addAttorneyToUser = function(data, callback) {
  this.findOneAndUpdate({ email: data.network_email }, { $set: { "my_network": data.my_network } }, { upsert: false }, callback);
}

users.statics.findOneQuery = function (query, callback) {
  this.findOne(query, callback);
};

users.statics.findQuery = function (queryObj = {}, callback) {
  this.find(queryObj.query || {}, queryObj.options || {}).sort(queryObj.sortOption || {}).exec(callback);
};

users.statics.encryptPassword = function (password, callback) {
  bcrypt.hash(password, config.saltRounds, function (err, hash) {
    if (err) return callback(err);
    callback(null, hash);
  });
};

users.statics.comparePassword = function (pass, encryptPass, callback) {
  bcrypt.compare(pass, encryptPass, function (err, res) {
    callback(err, res);
  });
};

users.statics.updatePassword = function (user_id, password, callback) {
  this.findOneAndUpdate({ _id: user_id }, { $set: { password: password } }, { upsert: false }, callback);
};

users.statics.deleteUser = function (user_id, reason, callback) {
  this.findOneAndUpdate({ _id: user_id }, { $set: { status: constant['STATUS']['DELETED'], deleted_reason: reason } }, { upsert: false }, callback);
};

users.statics.findProfile = function (user_id, key, nestedKey, data, step, callback) {
  this.findOne({ _id: user_id }, { _id: 0 }, function (err, result) {
    if (err) {
      callback(err);
    } else {
      result[key]['last_visited_page'] = step;
      if ((key == 'job_seeker_info' && step === 4) || (key == 'job_posters_info' && step === 1)) {
        result[key]['is_profile_completed'] = 'Y';
      }
      result['last_visited_profile'] = key;
      result[key][nestedKey] = data;
      callback(null, result);
    }
  });
};

users.statics.updateProfile = function (user_id, data, callback) {
  this.findOneAndUpdate({ _id: user_id }, { $set: data }, { upsert: false }, callback);
};

users.statics.updateForgotToken = function (data, callback) {
  this.findOneAndUpdate({ _id: data.user_id }, { $set: { "forgot_pass": data.forgot_pass } }, { upsert: false }, callback);
};

users.statics.findOneAndUpdateQuery = function (queryObj = {}, callback) {
  this.findOneAndUpdate(queryObj.query || {}, { $set: queryObj.data }, { new: true, upsert: false }, callback);
};

users.statics.getCandidatesByPostedJob = function(data, callback) {
  this.aggregate([
    {
      $match:{
        _id: {$ne: data.user_id}
      }
    },
    {
      $project:{
        email: 1,
        first_name: 1,
        practice_area_ids: '$job_seeker_info.basic_profile.practice_area_id',
        skill_used_ids: '$job_seeker_info.basic_profile.skill_used_id',
        state_ids: '$job_seeker_info.job_profile.willing_to_work_location_id',
      }
    },
    {
      $addFields:{
        practice_matchs: {
          $map:{
            input: "$practice_area_ids",
            as: "pr",
            in: {
              $cond: [ {$in: ["$$pr", data.practice_values]}, 1, 0]
            }
          }
        },
        skill_matchs: {
          $map:{
            input: "$skill_used_ids",
            as: "sk",
            in: {
              $cond: [ {$in: ["$$sk", data.skill_values]}, 1, 0]
            }
          }
        },
        state_matchs: {
          $map:{
            input: "$state_ids",
            as: "st",
            in: {
              $cond: [ {$eq: ["$$st", data.state]}, 1, 0]
            }
          }
        }
      }
    },
    {
      $addFields:{
        pr_sum:{
          $sum: "$practice_matchs"
        },
        sk_sum:{
          $sum: "$skill_matchs"
        },
        state:{
          $sum: "$state_matchs"
        },
      }
    },
    {
      $project:{
        email: 1,
        first_name: 1,
        practice:{
          $divide: ["$pr_sum", data.practice_values.length ]
        },
        skill:{
          $divide: ["$sk_sum", data.skill_values.length ]
        },
        state: 1
      }
    },
    {
      $match:{
        $and:[
          {state: 1},
          {practice: {$gte:0.5}},
          {skill: {$gt:0}}
        ]
      }
    }
  ]).exec(callback);
};

users.statics.getCandidatesByPostedRef = function(data, callback) {
  this.aggregate([
    {
      $match:{
        _id: {$ne: data.user_id}
      }
    },
    {
      $project:{
        email: 1,
        first_name: 1,
        practice_area_ids: '$job_seeker_info.basic_profile.practice_area_id',
        skill_used_ids: '$job_seeker_info.basic_profile.skill_used_id',
        state_ids: '$job_seeker_info.job_profile.willing_to_work_location_id',
      }
    },
    {
      $addFields:{
        practice_matchs: {
          $map:{
            input: "$practice_area_ids",
            as: "pr",
            in: {
              $cond: [ {$in: ["$$pr", data.practice_values]}, 1, 0]
            }
          }
        },
        skill_matchs: {
          $map:{
            input: "$skill_used_ids",
            as: "sk",
            in: {
              $cond: [ {$in: ["$$sk", data.skill_values]}, 1, 0]
            }
          }
        },
        state_matchs: {
          $map:{
            input: "$state_ids",
            as: "st",
            in: {
              $cond: [ {$eq: ["$$st", data.state]}, 1, 0]
            }
          }
        }
      }
    },
    {
      $addFields:{
        pr_sum:{
          $sum: "$practice_matchs"
        },
        sk_sum:{
          $sum: "$skill_matchs"
        },
        state:{
          $sum: "$state_matchs"
        },
      }
    },
    {
      $project:{
        email: 1,
        first_name: 1,
        practice:{
          $divide: ["$pr_sum", data.practice_values.length ]
        },
        skill:{
          $divide: ["$sk_sum", data.skill_values.length ]
        },
        state: 1
      }
    },
    {
      $match:{
        $and:[
          {state: 1},
          {practice: {$gte:0.5}},
          {skill: {$gt:0}}
        ]
      }
    }
  ]).exec(callback);
};

//export our module to use in user.js
module.exports = mongoose.model('users', users);
