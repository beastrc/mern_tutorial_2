var rfr = require('rfr'),
  mongoose = require('mongoose'),
  jobTypes = mongoose.model('job_types');

var jobTypeModel = rfr('/server/models/static/jobTypes');

jobTypes.count().exec(function(err, res) {
  if (res === 0) {
    // jobTypes.insertMany([{ name: '1099' }], function(err, res) {
    jobTypes.insertMany(
      [{ name: '1099', label: 'Freelance Project' }],
      function(err, res) {
        jobTypeModel.get();
      }
    );
  } else {
    //Temporary process fro LGBY-493
    jobTypes.updateOne(
      { name: '1099' },
      { label: 'Freelance Project' },
      function(err, docs) {
        if (err) {
          console.log(err);
        } else {
          
        }
      }
    );
    ///End
    jobTypeModel.get();
  }
});
