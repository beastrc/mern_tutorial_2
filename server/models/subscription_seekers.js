var rfr = require('rfr'),
  chargebee = require('chargebee'),
  mongoose = require('mongoose'),
  users = mongoose.model('users'),
  subscription_seekers = mongoose.model('subscription_seekers');

var helper = rfr('/server/models/shared/helper'),
  constant = rfr('/server/shared/constant');

// Get subscribe plans from Chargebee
function getSubscribePlans(req, res, cb) {
  helper.checkUserLoggedIn(req['headers']['token'], async function(err, result) {
    if (req.headers.token) {
      helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
        if (err) {
          cb({ Code: 401, Status: false, Message: err });
        } else {
          chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'],
            api_key : constant['CHARGEBEE_SITE_KEY']})
          chargebee.plan.list({
            limit : 10,
            "status[is]" : "active"
          }).request(function(error,result) {
              if(error){
                res.json({
                  err: error
                });
              }else{
                res.json({
                  list: result.list
                });
              }
            });
        }
      })
    } else {
      cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
    }
  });
}

// generate new checkout url
function generateCheckoutNewUrl(req, res, cb) {
  chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']})
  chargebee.hosted_page.checkout_new({
    subscription : {
      plan_id : req.body.plan_id
    },
    customer: {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
    }
  }).request(function(error,result){
    if(error){
      //handle error
      console.log(error);
    }else{
      res.send(result.hosted_page);
    }
  });
}

// store customer and subscription info from webhook
function storeSubscription(req, res, cb) {
  chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']});
  chargebee.event.list({
  limit : 1,
  "event_type[in]" : "['subscription_created', 'subscription_changed']"
  }).request(async function(error,result) {
    if(error){
      //handle error
      console.log(error);
    }else{
      for(var i = 0; i < result.list.length;i++){
          var entry=result.list[i];
          var content = entry.event.content;
          var event_subscription = content.subscription;
          var event_customer = content.customer;
          var event_type = entry.event.event_type;
          
          let save_subscription = {
            customer_id: event_customer.id, 
            email: event_customer.email,
            subscription_id: event_subscription.id,
            status: event_subscription.status,
            plan_id: event_subscription.plan_id,
            plan_unit_price: event_subscription.plan_unit_price,
            created_at: event_subscription.created_at,
            started_at: event_subscription.started_at,
            activated_at: event_subscription.activated_at,
            updated_at: event_subscription.updated_at,
            deleted: event_subscription.deleted,
            currency_code: event_subscription.currency_code
          }
          let update_subscription = {
            subscription_id: event_subscription.id,
            status: event_subscription.status,
            plan_id: event_subscription.plan_id,
            plan_unit_price: event_subscription.plan_unit_price,
            created_at: event_subscription.created_at,
            started_at: event_subscription.started_at,
            activated_at: event_subscription.activated_at,
            updated_at: event_subscription.updated_at,
            deleted: event_subscription.deleted,
            currency_code: event_subscription.currency_code
          }
          if(event_type == 'subscription_created' || event_type == 'subscription_changed') {
            const subscription_plan = await subscription_seekers.findOne({ customer_id: event_customer.id });
            if (!subscription_plan) {
              console.log("create new one")
              let newSubscription = new subscription_seekers(save_subscription);
              await newSubscription.save();
              let user = await users.findOne({email: event_customer.email});
              user.job_seeker_info.is_premium = 10000;
              user.job_seeker_info.is_referral = 10000;
              await users.updateOne({email: event_customer.email}, {job_seeker_info: user.job_seeker_info});
            }else{
              console.log("update new one")
              await subscription_seekers.update({customer_id: event_customer.id}, update_subscription);
            }
          }else{
            console.log("here is not working")
          }
        }
    }
  });
}

function getNewlySubscribedPlan(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;
        let subscription = await subscription_seekers.findOne({ email: email });
        res.json({
          plan: subscription
        });
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

// Get Subscribed Plan
function getSubscribedPlan(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;
        const subscription = await subscription_seekers.findOne({ email: email })
        if(subscription != null && subscription.has_scheduled_changes) {
          chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']})
          chargebee.subscription.retrieve_with_scheduled_changes(subscription.subscription_id).request(async function(error,result) {
            if(error){
              //handle error
              console.log(error);
            }else{
              res.json({
                plan: subscription,
                scheduledPlan: result.subscription
              })
            }
          });
        }else{
          res.json({
            plan: subscription
          })
        }
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

// cancel scheduled plan
function cancelScheduledPlan(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        let subscription_id = req.body.subscription_id;
        chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']})
        chargebee.subscription.remove_scheduled_changes(subscription_id).request(async function(error,result) {
          if(error){
            //handle error
            console.log(error);
          }else{
            var customer = result.customer;
            update_subscription = {
              has_scheduled_changes: false
            }
            await subscriptions.update({customer_id: customer.id}, update_subscription);
            res.json({
              isSuccess: true
            })
          }
        });
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

// update subscribed plan
function updateSubscribedPlan(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      const email = result.email;
      const old_subscription = await subscription_seekers.findOne({ email: email });
      const end_of_term = req.body.plan_price > old_subscription.plan_unit_price ? false : true;
      const update_subscription = {
        plan_id : req.body.plan_id,
        plan_unit_price: req.body.plan_price,
        has_scheduled_changes : end_of_term
      }

      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']})
        chargebee.subscription.update(req.body.subscription_id, {
          plan_id : req.body.plan_id,
          end_of_term : end_of_term
        }).request(async function(error,result) {
          if(error){
            //handle error
            console.log(error);
          }else{
            if(end_of_term) {
              chargebee.subscription.retrieve_with_scheduled_changes(req.body.subscription_id).request(async function(error,result) {
                if(error){
                  //handle error
                  console.log(error);
                }else{
                  let update_subscription_1 = {
                    has_scheduled_changes : result.subscription.has_scheduled_changes,
                  }
                  await subscription_seekers.update({customer_id: result.customer.id}, update_subscription_1);
                  const new_subscription = await subscription_seekers.findOne({ email: email })
                  res.json({
                    plan: new_subscription,
                    scheduledPlan: result.subscription,
                    isScheduled: end_of_term
                  })
                }
              });
            }else{
              await subscription_seekers.update({customer_id: result.customer.id}, update_subscription);
              const new_subscription = await subscription_seekers.findOne({ email: email })
              res.json({
                plan: new_subscription,
                isScheduled: end_of_term
              })
            }
          }
        });
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

// Cancel Subscription
async function cancelSubscription(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;

        let subscribed_plan = await subscription_seekers.findOne({ email: email })
        chargebee.configure({site : constant['CHARGEBEE_SITE_NAME'], api_key : constant['CHARGEBEE_SITE_KEY']})
        if (subscribed_plan) {
          try {
            if(req.body.cancel_active){
              console.log("delete request")
              chargebee.subscription.cancel(subscribed_plan.subscription_id,{
                end_of_term : true
              }).request(async function(error,result) {
                if(error){
                  //handle error
                  console.log(error);
                }else{
                  subscribed_plan.status = "cancelled";
                  subscribed_plan.cancelled_at = result.subscription.cancelled_at;
                  subscribed_plan.has_scheduled_changes = result.subscription.has_scheduled_changes;
                  subscribed_plan.cancelled_reason = req.body.message;
                  
                  let save_data = {
                    status: subscribed_plan.status,
                    cancelled_at: subscribed_plan.cancelled_at,
                    cancelled_reason: subscribed_plan.cancelled_reason
                  }

                  await subscription_seekers.update({customer_id: subscribed_plan.customer_id}, save_data);
                  
                  let updated_result = await subscription_seekers.findOne({customer_id: subscribed_plan.customer_id})

                  res.json({
                    plan: updated_result,
                  })
                }
              });
            }else{
              console.log("reactivate request")
              chargebee.subscription.reactivate(subscribed_plan.subscription_id, {}).request(async function(error,result) {
                if(error){
                  //handle error
                  console.log(error);
                }else{
                  subscribed_plan.status = "active";
                  subscribed_plan.cancelled_at = "";
                  subscribed_plan.cancelled_reason = ""; 
                  subscribed_plan.has_scheduled_changes = false;

                  let save_data = {
                    status: subscribed_plan.status,
                    cancelled_at: subscribed_plan.cancelled_at,
                    cancelled_reason: subscribed_plan.cancelled_reason,
                    has_scheduled_changes: subscribed_plan.has_scheduled_changes
                  }

                  await subscription_seekers.update({customer_id: subscribed_plan.customer_id}, save_data);
                  let updated_result = await subscription_seekers.findOne({customer_id: subscribed_plan.customer_id});
                  res.json({
                    plan: updated_result,
                  })
                }
              });
            }
          } catch (e) {
            res.status(400);
            return res.send({
              error: {
                message: e.message,
              }
            });
          }
        }
      }
    });
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

module.exports = {
  getSubscribePlans,
  getSubscribedPlan,
  cancelSubscription,
  generateCheckoutNewUrl,
  storeSubscription,
  updateSubscribedPlan,
  getNewlySubscribedPlan,
  cancelScheduledPlan
}
