var rfr = require('rfr'),
Mongoose = require('mongoose');

var config = rfr('/server/shared/config'),
utils = rfr('/server/shared/utils');

(async function() {
  var env = config['env'] || process.env.NODE_ENV;
  var dbObj = config['database'];
  var mongoOpts = {
    useNewUrlParser: true,
    family: 4
  };

  var con = Mongoose.connection;
  con.once('open', function() {
    utils.log('Connection with database succeeded');
    rfr('/server/schemas/dml/index');
  });
  con.on('error', function(err) {
    utils.log('Connection Error -->', err);
    utils.writeErrorLog('index', 'IIFE', 'Error while connecting to database', err);
  });
  
  var mongoConnect = async function() { 
    if (env !== 'development' || dbObj.username) {
      return Mongoose.connect('mongodb://' + dbObj['username'] + ':' + dbObj['password'] + '@' + dbObj['host'] + ':' + dbObj['port'] + '/' + dbObj['db'], mongoOpts);
    } else {
      return Mongoose.connect('mongodb://' + dbObj['host'] + ':' + dbObj['port'] + '/' + dbObj['db'], mongoOpts);
    }
  }
  
  try {
    await mongoConnect();
  } catch (error) {
    console.log("[ERROR] initial MongoDB connection failed => retrying:", error);
    await mongoConnect();
  }

  
}());
