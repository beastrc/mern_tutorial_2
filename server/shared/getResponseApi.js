const axios = require('axios');
var rfr = require('rfr');
var constant = rfr('/server/shared/constant');
var apiKey = constant['GETRESPONSE_APIKEY'];

function sendApi(apiUrl, method, param = {}) {
  return new Promise((resolve, reject) => {
    if(method == 'get') {
      axios.get(apiUrl, {
        headers: {
          'Content-Type' : 'application/json',
          'X-Auth-Token' : apiKey
        }
      }).then(function(response) {
        resolve(response['data']);
      });
    }
    if(method == 'post') {
      axios.post(apiUrl, param, {
        headers: {
          'Content-Type' : 'application/json',
          'X-Auth-Token' : apiKey
        }
      }).then(function(response) {
        resolve(response['httpStatus']);
      });
    }
  });
}

module.exports = {
  sendApi
}