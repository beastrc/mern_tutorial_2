var rfr = require('rfr'),
  request = require('request'),
  chargebee = require('chargebee'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  users = mongoose.model('users'),
  subscription_seekers = mongoose.model('subscription_seekers'),
  subscriptions = mongoose.model('subscriptions');

var nTermsModel = rfr('/server/models/negotiateTerms'),
  jobStatusModel = rfr('/server/models/jobStatus'),
  profileModel = rfr('/server/models/users/profile');

var helper = rfr('/server/models/shared/helper'),
  config = rfr('/server/shared/config'),
  constant = rfr('/server/shared/constant'),
  logger = rfr('/server/shared/logger'),
  mailHelper = rfr('/server/shared/mailHelper'),
  utils = rfr('/server/shared/utils');

var stripe = require("stripe")(config['stripe']['secret_key']);

async function deleteAllCustomers(){
  const spec_customer = await stripe.customers.list({
    limit: 100,
  });

  spec_customer['data'].filter( customer=>{
    const deleted = stripe.customers.del(
      customer.id
    );
  });
}


// Create Checkout Sessoin
async function createCheckoutSession(req, res, cb) {
  const domainURL = config['stripe']['redirect_url'];
  const { price_id } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],

      success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/canceled.html`,
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      }
    });
  }
}

// Get Payment Methods
function getPaymentMethods(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        try {
          // Search already created customer
          const spec_customer = await stripe.customers.list({
            email: result.email,
          });
          if(spec_customer['data'].length == 0){
            res.json({
            })
          }else{
            const paymentMethods = await stripe.paymentMethods.list({
              customer: spec_customer['data'][0].id,
              type: 'card',
            });

            res.json({
            })
          }
        }catch (e) {
          res.json({
          })
        }
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

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
      console.log(error);
    }else{
      for(var i = 0; i < result.list.length;i++){
          var entry=result.list[i];
          var content = entry.event.content;
          var event_subscription = content.subscription;
          var event_customer = content.customer;
          var event_type = entry.event.event_type;
          // define poster authority
          var project_post_cnt = 1;
          var is_search_candidate = false;
          var invite_candidate_cnt = 0;
          var is_invite_attorney = false;
          var is_upload_attorney = false;
          if(constant['SUBSCRIPTION_TIERS'][event_subscription.plan_id] == 2) {
            project_post_cnt = 5;
            is_search_candidate = true;
            is_invite_attorney = false;
            is_upload_attorney = false;
          }
          if(constant['SUBSCRIPTION_TIERS'][event_subscription.plan_id] == 3) {
            project_post_cnt = 10;
            is_search_candidate = true;
            invite_candidate_cnt = 5;
            is_invite_attorney = true;
          }
          if(constant['SUBSCRIPTION_TIERS'][event_subscription.plan_id] == 4) {
            project_post_cnt = 20;
            is_search_candidate = true;
            invite_candidate_cnt = 10000;
            is_invite_attorney = true;
            is_upload_attorney = true;
          }
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
            currency_code: event_subscription.currency_code,
            // define poster access
            project_post_cnt : project_post_cnt,
            is_search_candidate : is_search_candidate,
            invite_candidate_cnt : invite_candidate_cnt,
            is_invite_attorney : is_invite_attorney,
            is_upload_attorney : is_upload_attorney
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
            currency_code: event_subscription.currency_code,
            // define poster access
            project_post_cnt : project_post_cnt,
            is_search_candidate : is_search_candidate,
            invite_candidate_cnt : invite_candidate_cnt,
            is_invite_attorney : is_invite_attorney,
            is_upload_attorney : is_upload_attorney
          }
          if(event_type == 'subscription_created' || event_type == 'subscription_changed') {
            if(event_subscription.plan_id.includes("premium")){
              // job seeker subscription
              const subscription_plan = await subscription_seekers.findOne({ customer_id: event_customer.id });
              if (!subscription_plan) {
                console.log("create new one")
                let newSubscription = new subscription_seekers(save_subscription);
                await newSubscription.save();
              }else{
                console.log("update new one")
                await subscription_seekers.update({customer_id: event_customer.id}, update_subscription);
              }
            }else{
              // job poster subscription
              const subscription_plan = await subscriptions.findOne({ customer_id: event_customer.id });
              if (!subscription_plan) {
                console.log("create new one")
                let newSubscription = new subscriptions(save_subscription);
                await newSubscription.save();
              }else{
                console.log("update new one")
                await subscriptions.update({customer_id: event_customer.id}, update_subscription);
              }
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
        let subscription = await subscriptions.findOne({ email: email });
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
        const subscription = await subscriptions.findOne({ email: email })
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
      const old_subscription = await subscriptions.findOne({ email: email });
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
                  await subscriptions.update({customer_id: result.customer.id}, update_subscription_1);
                  const new_subscription = await subscriptions.findOne({ email: email })
                  res.json({
                    plan: new_subscription,
                    scheduledPlan: result.subscription,
                    isScheduled: end_of_term
                  })
                }
              });
            }else{
              await subscriptions.update({customer_id: result.customer.id}, update_subscription);
              const new_subscription = await subscriptions.findOne({ email: email })
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

// Apply Promo-Code on Subscription
function applyPromoCode(req, res, cb) {
  utils.writeInsideFunctionLog('subscriptions', 'applyPromoCode', req['body']);
  var resObj = Object.assign({}, utils.getErrorResObj()),
  reqBody = req['body'],
  promoCode = reqBody['promoCode'],
  index = constant['SUBSCRIPTION_PROMO_CODES'].findIndex(promo => promo['CODE_NAME'] === promoCode);
  
  
  helper.checkUserLoggedIn(req['headers']['token'], async function(err, result) {
    if (err) {
      resObj['message'] = constant['AUTH_FAIL'];
      resObj['code'] = constant['RES_OBJ']['CODE']['UNAUTHORIZED'];
      utils.callCB(cb, resObj);
    } else {
      const userId = result._id,
      email = result.email;
      
      let subscribed_plan = await subscriptions.findOne({ user_id: userId, status: { $in: ['active', 'trialing'] } });
            
      if (!subscribed_plan) {        

        resObj['message'] = constant['SUBSCRIPTION_NOT_EXIST'];
        resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
        utils.callCB(cb, resObj);
      } else {
        try{
          
          if(index == -1){ // if Promo code not exist
            resObj['message'] = constant['PROMO_CODE_NOT_EXIST'];
            resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
            utils.callCB(cb, resObj);
          }else{  // if Promo code exist

            // if you used this promo code already.
            const res = await new Promise((resolve) => {
              subscriptions.getAllPromoCodes({user_id:userId}, function(err, r) {
                if (err) {
                  reject(err);
                }
                resolve(r);
              });
            });
            if(res && res.length){
              var find_res = res[0].promos.filter(function(item){
                return item===promoCode;
              });
            }
            if(find_res && find_res.length){
              resObj['message'] = constant['PROMO_CODE_ALREADY_USED'];
              resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
              utils.callCB(cb, resObj);
            }else{ // if this promo code is new for you.

              // Retrieves the subscription with the given ID.        
              var subscription = await stripe.subscriptions.retrieve(
                subscribed_plan.subscription_id
              );

              if(constant['SUBSCRIPTION_PROMO_CODES'][index]['TYPE']==='trial'){
                var expire_timestamp = Math.floor(Date.now() / 1000);
                if(subscription.status =='active'){ // if new trial period promo code.
                  expire_timestamp =  Math.floor(Date.now() / 1000) + constant['SUBSCRIPTION_PROMO_CODES'][index]['VALUE']*60*60*24;
                }else if(subscription.status =='trialing'){ // if you are using trial period promo code, increase trial period.
                  expire_timestamp =  subscription.trial_end + constant['SUBSCRIPTION_PROMO_CODES'][index]['VALUE']*60*60*24;
                }
                subscription = await stripe.subscriptions.update(
                  subscribed_plan.subscription_id, 
                  {
                    trial_end: expire_timestamp,
                  }
                );

              }else if(constant['SUBSCRIPTION_PROMO_CODES'][index]['TYPE']==='discount'){
                // if coupon not exist, create a new coupon 
                const coupons = await stripe.coupons.list({
                  limit: 100,
                });
      
                var res = coupons.data.filter(function(item){
                  return item.id === promoCode
                });
      
                if(res.length==0){
                  const coupon = await stripe.coupons.create({
                    id: promoCode,
                    name: promoCode,
                    percent_off: constant['SUBSCRIPTION_PROMO_CODES'][index]['VALUE'],
                    duration: 'repeating',
                    duration_in_months: 1,
                  });
                }

                subscription = await stripe.subscriptions.update(
                  subscribed_plan.subscription_id, 
                  {
                    coupon: promoCode,
                  }
                );
              }
              
              // update DB
              subscribed_plan.renewed_at = subscription.current_period_end;
              subscribed_plan.status = subscription.status;
              subscribed_plan.promo_code.push(constant['SUBSCRIPTION_PROMO_CODES'][index]);

              const newSubscription = new subscriptions(subscribed_plan);
              subscribed_plan = await newSubscription.save();
              

              resObj = Object.assign({}, utils.getSuccessResObj());
              resObj['data'] = {
                'plan': subscribed_plan
              }
              resObj['code'] = constant['RES_OBJ']['CODE']['SUCCESS'];
              utils.callCB(cb, resObj);
            }
            
          }
        }catch (e) {
          resObj['message'] = e.message;
          resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
          utils.callCB(cb, resObj);
        }
      }
    }
  });
}

// Update Subscription 

function updateSubscription(req, res, cb) {
  utils.writeInsideFunctionLog('subscriptions', 'updateSubscription', req['body']);
  var resObj = Object.assign({}, utils.getErrorResObj()),
  reqBody = req['body'],
  planPrice = reqBody['price'],
  planKey = reqBody['key'];

  helper.checkUserLoggedIn(req['headers']['token'], async function(err, result) {
    if (err) {
      resObj['message'] = constant['AUTH_FAIL'];
      resObj['code'] = constant['RES_OBJ']['CODE']['UNAUTHORIZED'];
      utils.callCB(cb, resObj);
    } else {
      const userId = result._id,
      email = result.email;
      
      let subscribed_plan = await subscriptions.findOne({ user_id: userId, status: { $in: ['active', 'trialing'] } });
            
      if (!subscribed_plan) {
        resObj['message'] = constant['SUBSCRIPTION_NOT_EXIST'];
        resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
        utils.callCB(cb, resObj);
      } else {
        try{
          
          // Retrieves the subscription with the given ID.        
          var subscription = await stripe.subscriptions.retrieve(
            subscribed_plan.subscription_id
          );

          const prices = await getPriceObj(planPrice);

          // update the subscription
          const subscriptionRes = await stripe.subscriptions.update(
            subscribed_plan.subscription_id, 
            {
              cancel_at_period_end: false,
              proration_behavior: 'create_prorations',
              items: [{
                id: subscription.items.data[0].id,
                price: prices.data[0].id,
            }]
          });

          // update DB
          subscribed_plan.renewed_at = subscriptionRes.current_period_end;
          subscribed_plan.status = subscriptionRes.status;
          subscribed_plan.plan_price = planPrice;
          subscribed_plan.plan_key = planKey;
          subscribed_plan.cancel_at_period_end = subscriptionRes.cancel_at_period_end;
          
          const newSubscription = new subscriptions(subscribed_plan);
          subscribed_plan = await newSubscription.save();
          

          resObj = Object.assign({}, utils.getSuccessResObj());
          resObj['data'] = {
            'plan': subscribed_plan
          }
          resObj['code'] = constant['RES_OBJ']['CODE']['SUCCESS'];
          utils.callCB(cb, resObj);
            
        }catch (e) {
          resObj['message'] = e.message;
          resObj['code'] = constant['RES_OBJ']['CODE']['FAIL'];
          utils.callCB(cb, resObj);
        }
      }
    }
  });
}
// Create Subscription 
async function createSubscription(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const userId = result._id;

        let subscribed_plan = await subscriptions.findOne({ user_id: userId, status: { $in: ['active', 'trialing'] } })

        if (subscribed_plan) {
          res.json({
            plan: subscribed_plan
          })
        } else {
          const { paymentMethodId, planKey, planPrice } = req.body;
          const email = result.email;
          
          try {
            
            // Search already created customer or create customer
            const spec_customer = await stripe.customers.list({
              email: email,
            });
            var customer = null;
            if(spec_customer['data'].length == 0){
              customer = await stripe.customers.create({
                email: email
              });
            }else{
              customer = spec_customer['data'][0];
            }

            // Attach the payment method to the customer
            try {
              await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.id,
              });
            } catch (error) {
              return res.status('402').send({ error: { message: error.message } });
            }

            // Change the default invoice settings on the customer to the new payment method
            await stripe.customers.update(
              customer.id,
              {
                invoice_settings: {
                  default_payment_method: paymentMethodId,
                },
              }
            );
            
            const prices = await getPriceObj(planPrice);

            // Create the subscription
            var subscriptionRes = await stripe.subscriptions.create({
              customer: customer.id,
              items: [{ price: prices.data[0].id}]
            });
            //Save Subscription to DB
            const newSubscription = new subscriptions({
              user_id: userId,
              subscription_type: 1,
              projects: [],
              subscription_id: subscriptionRes.id,
              signup_at: subscriptionRes.created,
              plan_id: subscriptionRes.plan.id,
              plan_key: planKey,
              plan_price: planPrice,
              status: subscriptionRes.status,
              promo_code: [],
              renewed_at: subscriptionRes.current_period_end
            })

            subscribed_plan = await newSubscription.save();

            res.json({
              plan: subscribed_plan
            })

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

// get price obj if exist or create new price.
async function getPriceObj(planPrice){

  // list specific product.
  const products = await stripe.products.list({
    ids: ['product_monthly_' + planPrice]
  });
  
  // if product not exist
  if(!products.data.length){
    //create new product.
    const product = await stripe.products.create({
      id: 'product_monthly_' + planPrice,
      name: 'product_monthly_' + planPrice,
      description: 'product_monthly_' + planPrice,
    });

    //Create new price with above product.
    const price = await stripe.prices.create({
      product: 'product_monthly_' + planPrice,
      unit_amount: planPrice * 100,
      recurring: {
        interval: "month",
      },
      currency: "usd"
    });
  }

  //get price
  const prices = await stripe.prices.list({
    product: 'product_monthly_' + planPrice,
  });

  return prices;
}


// Cancel Subscription
async function cancelSubscription(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;

        let subscribed_plan = await subscriptions.findOne({ email: email })
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

                  await subscriptions.update({customer_id: subscribed_plan.customer_id}, save_data);
                  
                  let updated_result = await subscriptions.findOne({customer_id: subscribed_plan.customer_id})

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

                  await subscriptions.update({customer_id: subscribed_plan.customer_id}, save_data);
                  let updated_result = await subscriptions.findOne({customer_id: subscribed_plan.customer_id});
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

async function cancelSubscriptionByDeleteAccount(userId){

  let subscribed_plan = await subscriptions.findOne({ user_id: userId, status: { $in: ['active', 'trialing'] } })
  
  if (subscribed_plan) {
    try {
      const deletedSubscription = await stripe.subscriptions.del(
        subscribed_plan.subscription_id
      );
      console.log("del_sub", subscribed_plan.subscription_id);
      subscribed_plan.cancel_at_period_end = false;
      subscribed_plan.renewed_at = null;
      subscribed_plan.canceled_at = deletedSubscription.canceled_at;
      subscribed_plan.status = deletedSubscription.status;
      subscribed_plan.canceled_reason = "canceled by deleting account";
      await subscribed_plan.save();

      return true;
    } catch (e) {
      return false;
    }
  }else{
    return true;
  }
}

function subscriptionWebhook(reqBody){
  const subObj = reqBody.data.object;
  subscriptions.findOne({ subscription_id: subObj.id })
  .then((res)=>{
    res.cancel_at_period_end = subObj.cancel_at_period_end;
    res.canceled_at = subObj.canceled_at;
    res.renewed_at = subObj.current_period_end;
    res.status = subObj.status;
    res.canceled_at = subObj.canceled_at;
    res.save().then((pRes)=>{
      console.log("subscription update successfully",pRes);
    });

    // const newSubscription = new subscriptions(res);
    // subscribed_plan = await newSubscription.save();
  })
  .catch((err)=>{
    console.log(err);
  });

  console.log(reqBody.data.object);
}

function decreaseJobCnt(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;
        const subscription = await subscriptions.findOne({ email: email })
        const project_post_cnt = subscription.project_post_cnt - 1;
        const data = {
          project_post_cnt: project_post_cnt
        }
        await subscriptions.findOneAndUpdate(
          { email: email },
          { $set: data },
          { new: true, upsert: false }
        );
        res.json({
          success: true
        });
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

function decreaseInviteCnt(req, res, cb) {
  if (req.headers.token) {
    helper.checkUserLoggedIn(req.headers.token, async function (err, result) {
      if (err) {
        cb({ Code: 401, Status: false, Message: err });
      } else {
        const email = result.email;
        const subscription = await subscriptions.findOne({ email: email })
        const invite_candidate_cnt = subscription.invite_candidate_cnt - 1;
        const data = {
          invite_candidate_cnt: invite_candidate_cnt
        }
        await subscriptions.findOneAndUpdate(
          { email: email },
          { $set: data },
          { new: true, upsert: false }
        );
        res.json({
          success: true
        });
      }
    })
  } else {
    cb({ Code: 400, Status: false, Message: constant['AUTH_FAIL'] });
  }
}

module.exports = {
  applyPromoCode,
  getSubscribePlans,
  getSubscribedPlan,
  createCheckoutSession,
  cancelSubscriptionByDeleteAccount,
  createSubscription,
  cancelSubscription,
  updateSubscription,
  subscriptionWebhook,
  generateCheckoutNewUrl,
  storeSubscription,
  updateSubscribedPlan,
  getNewlySubscribedPlan,
  cancelScheduledPlan,
  decreaseJobCnt,
  decreaseInviteCnt
}
