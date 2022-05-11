var rfr = require('rfr');

var categoryCtlr = rfr('/server/controllers/static/categories'),
  degreeCtlr = rfr('/server/controllers/static/degrees'),
  employmentTypeCtlr = rfr('/server/controllers/static/employmentTypes'),
  practiceAreaCtlr = rfr('/server/controllers/static/practiceAreas'),
  skillCtlr = rfr('/server/controllers/static/skills'),
  stateCtlr = rfr('/server/controllers/static/states'),
  workLocationCtlr = rfr('/server/controllers/static/workLocations'),
  serviceChargeCtlr = rfr('/server/controllers/static/serviceCharge');

var universalCtlr = rfr('/server/controllers/universal'),
  userCtlr = rfr('/server/controllers/users'),
  postJobCtlr = rfr('/server/controllers/postJobs'),
  postRefCtlr = rfr('/server/controllers/postRefs'),
  adminCtlr = rfr('/server/controllers/admin'),
  savedJobsCtlr = rfr('/server/controllers/savedJobs'),
  jobStatusCtlr = rfr('/server/controllers/jobStatus'),
  refStatusCtlr = rfr('/server/controllers/refStatus'),
  negotiateTermsCtlr = rfr('/server/controllers/negotiateTerms'),
  stripeAccCtlr = rfr('/server/controllers/stripeAccounts'),
  wNineInfoCtrl = rfr('/server/controllers/wNineInfo'),
    
  subscriptions = rfr('/server/controllers/subscriptions'),
  subscription_seekers = rfr('/server/controllers/subscription_seekers'),

  chatRoomCtlr = rfr('/server/controllers/chatrooms'),
  messageCtlr = rfr('/server/controllers/messages');

//var chatRoomCtlr = rfr('/server/chat/middleware/chatrooms');
//var messageCtlr = rfr('/server/chat/middleware/messages');

var getHandler = {},
  postHandler = {};

// All get services
getHandler['/getCategories'] = categoryCtlr.get;
getHandler['/getDegrees'] = degreeCtlr.get;
getHandler['/getEmploymentTypes'] = employmentTypeCtlr.get;
getHandler['/getPracticeAreas'] = practiceAreaCtlr.get;
getHandler['/getStates'] = stateCtlr.get;
getHandler['/getSkills'] = skillCtlr.get;
getHandler['/getWorkLocations'] = workLocationCtlr.get;
getHandler['/getServiceCharge'] = serviceChargeCtlr.get;

getHandler['/getUserProfile/:forUser/:fromUser/:userId?'] =
  userCtlr.getUserProfile;
getHandler['/resendEmail/:email'] = userCtlr.resendEmail;
getHandler['/verifyEmail/:secretId'] = userCtlr.verifyEmail;
getHandler['/getCandidatesData'] = userCtlr.getCandidatesData;
getHandler['/getUserData'] = userCtlr.getUserData;
getHandler['/getMyNetwork'] = userCtlr.getMyNetwork;
getHandler['/getUserList'] = userCtlr.getUserList;

getHandler['/getPostJob/:jobId'] = postJobCtlr.getPostJobData;

getHandler['/exportUsers'] = adminCtlr.exportUsers;
getHandler['/exportPostJobs'] = adminCtlr.exportPostJobs;

getHandler['/getAllLists'] = universalCtlr.getAllListsData;
getHandler['/getLogFile/:token/:fileName'] = universalCtlr.getLogFile;

getHandler['/getPostJobDetails/:jobId/:userRole?'] =
  postJobCtlr.getPostJobDetails;
getHandler['/getInvitablePostJobs'] = postJobCtlr.getInvitablePostJobs;
getHandler['/getPostJobByUserId/:page'] = postJobCtlr.getPostJobByUserId;


getHandler['/getSavedJobs/:page'] = savedJobsCtlr.get;
getHandler['/getAppliedJobs/:page'] = jobStatusCtlr.getAll;
getHandler['/getJobStatus/:jobId/:userId'] = jobStatusCtlr.getOneJobStatus;

getHandler['/getMessages'] = messageCtlr.getMessages;

// app.get('/api/chatrooms', (req, res) => {
//   // call getChatRooms
// });

// app.post('/api/chatroom', (req, res) => {
//   //call middle ware 'postChatRoom
//  });

// app.put('/api/chatroom', (req, res) => {
//   // call middleware putChatRoom
// });

// app.delete('/api/chatroom/:id', (req, res) => {
//   //call middleware deleteChatRoom
// });

// app.get('/api/messages', (req, res) => {
//   // call middleware getMessage
// });

// app.delete('/api/message/:id', (req, res) => {
//   //call middleware delete Message
//  });

// All post services
postHandler['/login'] = userCtlr.login;
postHandler['/signup'] = userCtlr.signup;
postHandler['/signupAttorney'] = userCtlr.signupAttorney;
postHandler['/removeUserInNetwork'] = userCtlr.removeUserInNetwork;
postHandler['/forgotPassword'] = userCtlr.forgotPassword;
postHandler['/checkResetLink/:secretId'] = userCtlr.checkResetLink;
postHandler['/resetPassword/:secretId'] = userCtlr.resetPassword;
postHandler['/changePassword'] = userCtlr.changePassword;
postHandler['/logout'] = userCtlr.logout;

postHandler['/userBasicProfile'] = userCtlr.basicProfile;
postHandler['/userExperienceProfile'] = userCtlr.experienceProfile;
postHandler['/userNetworkProfile'] = userCtlr.networkProfile;
postHandler['/userJobProfile'] = userCtlr.jobProfile;
postHandler['/posterBasicProfile'] = userCtlr.posterBasicProfile;
postHandler['/posterAvailProfile'] = userCtlr.posterAvailProfile;

postHandler['/postJob'] = postJobCtlr.postJobData;
postHandler['/updatePostedJobStatus'] = postJobCtlr.updatePostedJobStatus;
postHandler['/getStepData'] = postJobCtlr.getStepData;
postHandler['/getPostJobs/:page'] = postJobCtlr.getAll;

postHandler['/postRef'] = postRefCtlr.postRefData;
postHandler['/getPostRefByUserId'] = postRefCtlr.getPostRefByUserId;

postHandler['/updateSavedJob'] = savedJobsCtlr.updateSavedJob;
postHandler['/updateJobStatus'] = jobStatusCtlr.updateJobStatus;
postHandler['/saveRating'] = jobStatusCtlr.saveRating;

postHandler['/updateRefStatus'] = refStatusCtlr.updateRefStatus;

postHandler['/updateNegotiateTerms'] = negotiateTermsCtlr.update;
postHandler['/updateDeliverableStatus'] =
  negotiateTermsCtlr.updateDeliverableStatus;
postHandler['/updateHourlyFixedTerms'] =
  negotiateTermsCtlr.updateHourlyFixedTerms;
postHandler['/downloadDeliverableFile'] =
  negotiateTermsCtlr.downloadDeliverableFile;

postHandler['/getReleaseFundUrl'] = stripeAccCtlr.getReleaseFundUrl;
postHandler['/getCreateStripeAccountLink'] =
  stripeAccCtlr.getCreateStripeAccountLink;
postHandler['/setStripeAccountInfo'] = stripeAccCtlr.setStripeAccountInfo;
postHandler['/getStripeDashboardLink'] = stripeAccCtlr.getStripeDashboardLink;
postHandler['/transferFunds'] = stripeAccCtlr.transferFunds;
postHandler['/realeaseFund'] = stripeAccCtlr.realeaseFund;

postHandler['/setWNineInfo'] = wNineInfoCtrl.setAndUpdate;

postHandler['/contactus'] = universalCtlr.contactUs;
postHandler['/bookDemo'] = universalCtlr.bookDemo;

postHandler['/sendMessage'] = universalCtlr.sendMsg;

postHandler['/webhook'] = stripeAccCtlr.webhook;

postHandler['/deletePostedJob'] = postJobCtlr.updatePostedJobStatus;
postHandler['/deleteUserAccount'] = userCtlr.deleteAccount;

getHandler['/getSubscribedPlan'] = subscriptions.getSubscribedPlan;
getHandler['/getSubscribePlans'] = subscriptions.getSubscribePlans;
// get newly subscribed plan
postHandler['/getNewlySubscribedPlan'] = subscriptions.getNewlySubscribedPlan;
// cancel scheduled plan
postHandler['/cancelScheduledPlan'] = subscriptions.cancelScheduledPlan;
// listen subscription event and store
postHandler['/storeSubscription'] = subscriptions.storeSubscription;
// update subscribed plan
postHandler['/updateSubscribedPlan'] = subscriptions.updateSubscribedPlan;
postHandler['/createCheckoutSession'] = subscriptions.createCheckoutSession;
postHandler['/createSubscription'] = subscriptions.createSubscription;
// generate checkout new url
postHandler['/generateCheckoutNewUrl'] = subscriptions.generateCheckoutNewUrl;
postHandler['/generateCheckoutExistingUrl'] = subscriptions.generateCheckoutExistingUrl;
// decrease the job cnt after creating a job
postHandler['/decreaseJobCnt'] = subscriptions.decreaseJobCnt;
// decrease the invite cnt after invite a candidate
postHandler['/decreaseInviteCnt'] = subscriptions.decreaseInviteCnt;

// job seeker subscription
getHandler['/getSubscribedPlanSeeker'] = subscription_seekers.getSubscribedPlan;
getHandler['/getSubscribePlansSeeker'] = subscription_seekers.getSubscribePlans;
// get newly subscribed plan
postHandler['/getNewlySubscribedPlanSeeker'] = subscription_seekers.getNewlySubscribedPlan;
// cancel scheduled plan
postHandler['/cancelScheduledPlanSeeker'] = subscription_seekers.cancelScheduledPlan;
postHandler['/cancelSubscriptionSeeker'] = subscription_seekers.cancelSubscription;
// listen subscription event and store
// postHandler['/storeSubscriptionSeeker'] = subscription_seekers.storeSubscription;
// update subscribed plan
postHandler['/updateSubscribedPlanSeeker'] = subscription_seekers.updateSubscribedPlan;
// generate checkout new url
postHandler['/generateCheckoutNewUrlSeeker'] = subscription_seekers.generateCheckoutNewUrl;
postHandler['/generateCheckoutExistingUrlSeeker'] = subscription_seekers.generateCheckoutExistingUrl;


postHandler['/cancelSubscription'] = subscriptions.cancelSubscription;
postHandler['/updateSubscription'] = subscriptions.updateSubscription;
postHandler['/applyPromoCode'] = subscriptions.applyPromoCode;

postHandler['/createChatRoom'] = chatRoomCtlr.postChatRoom;
postHandler['/createMessage'] = messageCtlr.postMessage;
postHandler['/getChatRooms'] = chatRoomCtlr.getChatRooms;

function _bindAllGetRequests(app) {
  for (var key in getHandler) {
    app.get(key, getHandler[key]);
  }
}

function _bindAllPostRequests(app) {
  for (var key in postHandler) {
    app.post(key, postHandler[key]);
  }
}

function bindAllRequests(app) {
  _bindAllGetRequests(app);
  _bindAllPostRequests(app);
}

module.exports.bindAllRequests = bindAllRequests;
