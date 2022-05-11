var rfr = require('rfr'),
mongoose = require('mongoose'),
serviceCharges = mongoose.model('service_charges');

var serviceChargeModel = rfr('/server/models/static/serviceCharge');

serviceCharges.count().exec(function(err, res) {
  if (res === 0) {
    serviceCharges.insertMany([
      //{'service_charge': 15}
      {'service_charge': 2.5}
    ], function() {
      serviceChargeModel.get();
    });
  } else {
    serviceCharges.updateOne({'service_charge': 15},{'service_charge': 2.5},function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        serviceChargeModel.get();
      }
    });
    serviceChargeModel.get();
  }
});
