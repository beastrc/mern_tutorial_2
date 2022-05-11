const mongoose = require('mongoose');
var rfr = require('rfr');

var refStatusSchema = rfr('/server/schemas/ddl/refStatus'),
  nTermsSchema = rfr('/server/schemas/ddl/negotiateTerms'),
  userSchema = rfr('/server/schemas/ddl/users');

var constant = rfr('/server/shared/constant'),
  utils = rfr('/server/shared/utils');

var helper = rfr('/server/models/shared/helper');

function _actionsAfterUpdateRefStatus(dataObj, callback) {
  utils.writeInsideFunctionLog('refStatus', '_actionsAfterUpdateRefStatus', dataObj);

  switch (dataObj['status']) {
    case 101: _sendAppliedMail(dataObj, callback);
      break;
    case 103: _createNegotiateTerms(dataObj, callback);
      break;
    case -103: _updateNegotitateTermStatus(dataObj, callback);
      break;
    case 104: _sendMailOnAcceptTerms(dataObj, callback);
      break;
    case -104: _updateStripeChargeStatus(dataObj, callback);
      break;
    default: callback(null, true);
  }
}

function _updateRefStatusAfterAllChecks(updateDataObj, result, cb, fromCancelOrder = false) {
  utils.writeInsideFunctionLog('refStatus', '_updateRefStatusAfterAllChecks');

  console.log("updateDataObj:", updateDataObj)

  if (updateDataObj['dbQueryParams']['status'] === (constant['REF_STEPS']['S_PENDING'] * -1) && !fromCancelOrder) {
    _cancelOrder(updateDataObj, result, cb);
  } else {
    let resObj = Object.assign({}, utils.getErrorResObj());
    if(updateDataObj['dbQueryParams']['status'] === constant['REF_STEPS']['REF_RESPOND']){
      refStatusSchema.updateQuery(updateDataObj['dbQueryParams'], function (uErr, uRes) {
        if (uErr) {
          utils.callCB(cb, resObj);
          utils.writeErrorLog('refStatus', '_updateRefStatusAfterAllChecks', 'Error while updating ref status detail', uErr, updateDataObj['dbQueryParams']);
        } else {
          let dataObj = {
            refId: updateDataObj['dbQueryParams']['ref_id'],
            seekerId: updateDataObj['dbQueryParams']['user_id'],
            posterId: updateDataObj['posterId'],
            role: updateDataObj['role'],
            status: uRes['status'],
            first_name: result['first_name'],
            last_name: result['last_name'],
            seekerEmail: result['email']
          }
          _actionsAfterUpdateRefStatus(dataObj, function (error, success) {
            if (success) {
              resObj = Object.assign({}, utils.getSuccessResObj());
              resObj['data'] = {
                'status': uRes
              }
              utils.callCB(cb, resObj);
            } else {
              resObj['message'] = error;
              utils.callCB(cb, resObj);
            }
          });
        }
      });
    }
  }
}

function _afterAllConflictsCheck(updateDataObj, queryObj, result, cb) {
  utils.writeInsideFunctionLog('refStatus', '_afterAllConflictsCheck', updateDataObj);

  let resObj = Object.assign({}, utils.getErrorResObj());
  let refId = updateDataObj['dbQueryParams']['ref_id'];
  let action = updateDataObj['dbQueryParams']['status'];
  refStatusSchema.findQuery(queryObj, function (sErr, sRes) {
    if (sErr) {
      utils.callCB(cb, resObj);
      utils.writeErrorLog('refStatus', '_afterAllConflictsCheck', 'Error while getting ref status detail', sErr, queryObj['query']);
    } else {
      if (sRes[0] && sRes[0]['status'] < 0) {
        resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
        resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
        utils.callCB(cb, resObj);
      } else {
        let absAction = Math.abs(action);
        if (sRes[0] && (absAction < sRes[0]['status'])) {
          if ((action === (constant['REF_STEPS']['INTERVIEWING'] * -1)) && sRes[0]['status'] === constant['REF_STEPS']['N_TERMS']) {
            queryObj['query'] = {
              'refId': refId,
              'seekerId': result['_id']
            }
            nTermsSchema.findQuery(queryObj, function (nErr, nRes) {
              if (!!nRes && nRes.length > 0) {
                if (nRes[0]['status'] === constant['N_TERMS_STATUS']['SENT']) {
                  resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
                  resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
                  utils.callCB(cb, resObj);
                } else {
                  _updateRefStatusAfterAllChecks(updateDataObj, result, cb);
                }
              } else {
                utils.callCB(cb, resObj);
                utils.writeErrorLog('refStatus', '_afterAllConflictsCheck', 'Error while getting negotiate terms detail', (nErr || nRes), queryObj['query']);
              }
            });
          } else {
            resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
            resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
            utils.callCB(cb, resObj);
          }
        } else {
          _updateRefStatusAfterAllChecks(updateDataObj, result, cb);
        }
      }
    }
  });
}

function updateRefStatus(req, res, cb) {
  utils.writeInsideFunctionLog('refStatus', 'updateRefStatus', req['body']);
  let resObj = Object.assign({}, utils.getErrorResObj());
  helper.checkUserLoggedIn(req.headers.token, function (err, result) {
    if (err) {
      resObj['message'] = constant['AUTH_FAIL'];
      resObj['code'] = constant['RES_OBJ']['CODE']['UNAUTHORIZED'];
      utils.callCB(cb, resObj);
    } else {
      let reqBody = req['body'],
        refId = reqBody['ref_id'],
        action = reqBody['status'],
        posterId = null,
        role = 'seeker';
      if(action==constant['REF_STEPS']['REF_ACCEPTED']){
        let status_id = reqBody['status_id'];
        refStatusSchema.updateOne({_id: status_id},{status: constant['REF_STEPS']['REF_ACCEPTED']}, function(err, pRes){
          if(!err){
            resObj = Object.assign({}, utils.getSuccessResObj());
            resObj['data'] = {
              'ref_status': constant['REF_STEPS']['REF_ACCEPTED'],
            }
            utils.callCB(cb, resObj);
          }else{
            resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
            resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
            utils.callCB(cb, resObj);
          }
        });
      }else{
        let dbQueryParams = {
          "user_id": result['_id'],
          "ref_id": refId,
          "status": action
        };
        let queryObj = {
          'query': {
            "user_id": result['_id'],
            "ref_id": refId
          }
        };
        if (reqBody['user_id']) {
          role = 'poster';
          posterId = result['_id'];
          dbQueryParams['user_id'] = reqBody['user_id'];
          queryObj.query['user_id'] = reqBody['user_id'];
        }
        dbQueryParams['declined_by'] = (action < 0) ? role : '';
  
        let updateDataObj = {
          dbQueryParams: dbQueryParams,
          posterId: posterId,
          role: role
        }
        let userQueryParams = {
          'query': { '_id': dbQueryParams['user_id'] }
        };
        userSchema.findQuery(userQueryParams, function (uErr, uRes) {
          if (!!uRes && uRes.length) {
            let isBarIdValid = uRes[0]['is_bar_id_valid'];
            let freezeActivity = uRes[0]['freeze_activity'];
  
            if (role === 'seeker' && action === constant['REF_STEPS']['APPLIED'] &&
              (isBarIdValid.toLowerCase() !== reqBody['is_bar_id_valid'].toLowerCase())) {
              resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
              resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
              utils.callCB(cb, resObj);
            } else if (freezeActivity !== reqBody['freeze_activity']) {
              resObj['code'] = constant['RES_OBJ']['CODE']['CONFLICT'];
              resObj['message'] = constant['RES_OBJ']['MSG']['CONFLICT'];
              utils.callCB(cb, resObj);
            } else if (freezeActivity) {
              resObj['code'] = constant['RES_OBJ']['CODE']['LOCKED'];
              resObj['message'] = constant['RES_OBJ']['MSG']['LOCKED'];
              utils.callCB(cb, resObj);
            } else if ((isBarIdValid.toLowerCase() === 'yes' && role === 'seeker') || (role === 'poster' && !freezeActivity) || (isBarIdValid.toLowerCase() === 'no' && role === 'seeker' && !freezeActivity && action !== constant['REF_STEPS']['APPLIED'])) {
              if (reqBody['user_id'] && action === constant['REF_STEPS']['N_TERMS']) {
                let queryParam = {
                  'query': {
                    'ref_id': refId,
                    'status': { '$gte': constant['REF_STEPS']['N_TERMS'] }
                  }
                }
                refStatusSchema.findQuery(queryParam, function (jErr, jRes) {
                  if (jErr) {
                    utils.callCB(cb, resObj);
                    utils.writeErrorLog('refStatus', 'updateRefStatus', 'Error while getting ref status detail', jErr, queryParam['query']);
                  } else if (!!jRes && jRes.length) {
                    resObj['code'] = constant['RES_OBJ']['CODE']['UNPROCESSABLE'];
                    resObj['message'] = constant['RES_OBJ']['MSG']['UNPROCESSABLE'];
                    utils.callCB(cb, resObj);
                  } else {
                    _afterAllConflictsCheck(updateDataObj, queryObj, result, cb);
                  }
                })
              } else {
                _afterAllConflictsCheck(updateDataObj, queryObj, result, cb);
              }
            } else {
              resObj['code'] = constant['RES_OBJ']['CODE']['INVALID_BAR_ID'];
              resObj['message'] = constant['INVALID_BAR_ID'];
              utils.callCB(cb, resObj);
            }
          } else {
            utils.writeErrorLog('refStatus', 'updateRefStatus', 'Error while getting user detail', (uErr || uRes), userQueryParams['query']);
          }
        })
      }
    }
  });
}


module.exports = {
  updateRefStatus
}