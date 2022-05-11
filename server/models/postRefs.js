'use strict';

let rfr = require('rfr'),
  moment = require('moment'),
  _ = require('lodash'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  users = mongoose.model('users'),
  post_Refs = mongoose.model('post_Refs');

let config = rfr('/server/shared/config'),
  constant = rfr('/server/shared/constant'),
  mailHelper = rfr('/server/shared/mailHelper'),
  utils = rfr('/server/shared/utils');

let helper = rfr('/server/models/shared/helper'),
  validator = rfr('/server/models/shared/validator');

function _sendMailOnPostRef(userDataObj, refDataObj) {  
  //console.log("refdata",refDataObj);
  post_Refs.getCriteriaValues({ ref_id: refDataObj._id}, function(pErr, pRes){
    if(pErr){
      utils.callCB(cb, refDataObj);
    }else{
      //console.log("getCriteriaValues",pRes)
      pRes[0].user_id = refDataObj.userId;
      users.getCandidatesByPostedRef(pRes[0],function(ppErr, ppRes){
        if(ppErr){
          utils.callCB(cb, refDataObj);
        }else{
          ppRes.filter(function(item){
            let mailObj = {
              posterName: item['first_name'],
              refName: `${utils.toTitleCase(refDataObj['title'])}`,
              url: config['server']['end_point']+"/ref-search/"+refDataObj._id,
            };
          
            utils.writeInsideFunctionLog('postRefs', '_sendMailOnPostRef', mailObj);
          
            mailHelper.sendMailInBackground(
              item['email'],
              'Ref Posted',
              'REF_POSTED_TO_CANDIDATES',
              mailObj
            );
          });
        }
      });
    }
  });
  
  // let mailObj = {
  //   posterName: userDataObj['first_name'],
  //   refName: `${utils.toTitleCase(refDataObj['refHeadline'])}`,
  //   url: config['server']['end_point']+"/project-search/"+refDataObj._id,
  // };

  // utils.writeInsideFunctionLog('postRefs', '_sendMailOnPostRef', mailObj);

  // mailHelper.sendMailInBackground(
  //   userDataObj['email'],
  //   'Ref Posted',
  //   'JOB_POSTED',
  //   mailObj
  // );
}



/**
 * @method postRefData
 * @used for post a referral
 * @param object req, object res
 * @return object res
 * @author Zhu
 */

function postRefData(req, res, callback) {
  utils.writeInsideFunctionLog('postRefs', 'postRefData');
  
  var data = req.body;
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, function(err, result) {
      if (err) {
        callback({ Code: 401, Status: false, Message: err });
      } else {
        data.userId = result._id;
        let validateObj = {};
        validateObj = validator.missingParameters(req.body, [
          'title',
          'practiceArea',
          'skillsNeeded',
          'refDescription',
        ]);
        
        if (validateObj.isValid) {
          post_Refs.saveData(data, function(err, resp) {
            if (err) {
              callback({ Code: 400, Status: false, Message: constant['OOPS_ERROR'] });
              utils.writeErrorLog(
                'post_Refs',
                '_postRefSaveData',
                'Error while creating entry in post referral',
                err,
                data,
              );
            } else {
              _sendMailOnPostRef(result, resp);
              callback({
                Code: 200,
                Status: true,
                Message: constant['SUCCESS_POST_REF']
              });
            }
          });
        } else {
          callback({ Code: 400, Status: false, Message: validateObj.message });
        }
      }
    });
  } else {
    callback({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

function getPostRefByUserId(req, res, callback) {
  utils.writeInsideFunctionLog('postRefs', 'postRefData');
  let pData = req.body;

  var resObj = Object.assign({}, utils.getErrorResObj());
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, function(err, result) {
      if (err) {
        callback({ Code: 401, Status: false, Message: err });
      } else {
        if(pData.type=="posted"){
          post_Refs.getPostedRefsByUserId({userId: result._id}, function(pErr, pResult) {
            if (pErr) {
              callback({ Code: 400, Status: false, Message: constant['OOPS_ERROR'] });
            } else {
              if (pResult !== null) {
                resObj = Object.assign({}, utils.getSuccessResObj());
                resObj['data'] = {
                  refs: pResult
                };
                //console.log("posted ref",pResult[0]);
              } else {
                resObj['message'] = constant['NO_RECORD_FOUND'];
              }
              utils.callCB(callback, resObj);
            }
          });
        }else if(pData.type=="search"){
          console.log("AAAAAAAAAA", pData);
          pData.userId = result._id;
          post_Refs.getPostedRefsAll(pData, function(pErr, pResult) {
            if (pErr) {
              callback({ Code: 400, Status: false, Message: constant['OOPS_ERROR'] });
            } else {
              if (pResult !== null) {
                resObj = Object.assign({}, utils.getSuccessResObj());
                resObj['data'] = {
                  refs: pResult
                };
                //console.log("Search res", pResult);
              } else {
                resObj['message'] = constant['NO_RECORD_FOUND'];
              }
              utils.callCB(callback, resObj);
            }
          });
        }else if(pData.type=="responded"){
          post_Refs.getRespondedRefsAll({userId: result._id}, function(pErr, pResult) {
            if (pErr) {
              callback({ Code: 400, Status: false, Message: constant['OOPS_ERROR'] });
            } else {
              if (pResult !== null) {
                resObj = Object.assign({}, utils.getSuccessResObj());
                resObj['data'] = {
                  refs: pResult
                };
              } else {
                resObj['message'] = constant['NO_RECORD_FOUND'];
              }
              utils.callCB(callback, resObj);
            }
          });
        }else{
          callback({ Code: 401, Status: false, Message: false });
        }
      }
    });
  } else {
    callback({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}


module.exports = {
  postRefData,
  getPostRefByUserId,
};

