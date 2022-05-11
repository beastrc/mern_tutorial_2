import React from 'react';
import axios from 'axios'
import { Link, browserHistory } from 'react-router';
import { LegablyLargeFooter } from '../index';
import { constant, utils, cookieManager } from '../../shared/index';
import ModalPopup from '../shared/modal-popup/ModalPopup';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export default class Subscription extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      subscribedPlan: null,
      subscribePlans: [],
      modalPopupObj: {},
      code: '',
      code_label: '',
      coupon_list: [],
      currentUser: {},
      isSelectedPlan: 0,
      scheduledPlan: null
    };
    this.gotoCheckOut = this.gotoCheckOut.bind(this)
    this.getAllPlans = this.getAllPlans.bind(this)
    this.chargebeeInit = this.chargebeeInit.bind(this)
    this.getSubscribedPlan = this.getSubscribedPlan.bind(this)
    this.getNewlySubscribedPlan = this.getNewlySubscribedPlan.bind(this)
    this.cancelSubscription = this.cancelSubscription.bind(this)
    this.backRouter = this.backRouter.bind(this)
  }

  componentDidMount() {
    // get current user
    let currentUser = utils.getCurrentUser();
    if(!currentUser.is_poster_profile_completed) {
      utils.changeUrl("/subscriptions_seeker");
    }
    this.setState({
      currentUser: currentUser
    });
    this.getAllPlans();
    this.chargebeeInit();
    this.getSubscribedPlan();
  }

  getSubscribedPlan() {
    let _this = this;
    // get subscribed plan
    utils.apiCall('SUBSCRIBED_PLAN', {}, function (err, response) {
      if (err) {
      } else {
        let subscribedPlan = response.data.plan;
        _this.setState({
          subscribedPlan: subscribedPlan,
          scheduledPlan: subscribedPlan.has_scheduled_changes ? response.data.scheduledPlan : null,
          isSelectedPlan: subscribedPlan.status == 'active' ? 1 : 2
        })
      }
    })
  }

  getNewlySubscribedPlan() {
    let _this = this;
    utils.apiCall('GET_SUBSCRIBED_PLAN', {}, function (err, response) {
      if (err) {
        console.log(err)
      } else {
        let legablyLoader = $('#legably_loader');
        legablyLoader.addClass('hide');
        let userData = utils.getCurrentUser();
        if (userData) {
          userData.subscription_status = 1;
          userData.poster_plan_id = response.data.plan['plan_id'];
          cookieManager.setObject('currentUser', userData);
        }
        _this.setState({
          subscribedPlan: response.data.plan,
          isSelectedPlan: 1
        })
      }
    })
  }

  chargebeeInit() {
    // Chargebee drop in script imort
    setTimeout(function() {
      const el = document.createElement('script');
      el.onload = () => {
        window.Chargebee.init({
          "site": "legably-test"
        });
        window.Chargebee.registerAgain();
      };
      el.setAttribute('src', 'https://js.chargebee.com/v2/chargebee.js');
      document.body.appendChild(el);
    }, 2000);
  }

  getAllPlans() {
    let _this = this;
    // get subscription plans
    utils.apiCall('SUBSCRIBE_PLANS', {}, function (err, response) {
      if (err) {
        console.log(err)
      } else {        
        _this.setState({
          subscribePlans: response.data.list
        })
      }
    })
  }

  gotoCheckOut(_planId) {
    let _this = this;
    let {currentUser} = this.state;
    let data = {
      plan_id: _planId,
      email: currentUser.email,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name  
    }
    const urlEncode = function(data) {
      var str = [];
      for (var p in data) {
          if (data.hasOwnProperty(p) && (!(data[p] == undefined || data[p] == null))) {
              str.push(encodeURIComponent(p) + "=" + (data[p] ? encodeURIComponent(data[p]) : ""));
          }
      }
      return str.join("&");
    }
    let cbInstance = window.Chargebee.init({
      site: "legably-test"
    });
    cbInstance.openCheckout({
      hostedPage:async () => {
        const apiUrl = await config.getConfiguration().API_ENDPOINT + constant['API_URLS']['GENERATE_CHECKOUT_NEW_URL'].name;
        return await axios.post(apiUrl, urlEncode(data)).then((response) => response.data)
      },
      success(hostedPage) {
        setTimeout(function() {
          _this.getNewlySubscribedPlan()
        }, 10000);
        let legablyLoader = $('#legably_loader');
        legablyLoader.removeClass('hide');
      },
      close:() => {
        
      },
      step(step) {

      }
    });
  }

  updatePlan(_planId, _price) {
    let _this = this;
    let { subscribedPlan } = this.state;
    let data = {
      subscription_id: subscribedPlan && subscribedPlan.subscription_id,
      plan_id: _planId,
      plan_price: _price
    }
    let popupType = constant['POPUP_TYPES']['CHANGE_PLAN'];
    _this.setState({
      modalPopupObj: {
        type: popupType,
        textarea: true,
        noBtnText: 'Cancel',
        yesBtnText: 'Proceed',
        iconImgUrl: constant['IMG_PATH'] + 'svg-images/negative-alert-icon.svg',
        msg: constant['POPUP_MSG']['UPDATE_SUBSCRIPTION'],
        noBtnAction: function () {
          utils.modalPopup(popupType, 'hide', _this);
        },
        yesBtnAction: function (msg) {
          utils.modalPopup(popupType, 'hide', _this);
          // update subscribed plan
          utils.apiCall('UPDATE_SUBSCRIBED_PLAN', {data:data}, function (err, response) {
            if (err) {
            } else {
              let userData = utils.getCurrentUser();
              if (userData) {
                userData.poster_plan_id = response.data.plan['plan_id'];
                cookieManager.setObject('currentUser', userData);
              }
              _this.setState({
                subscribedPlan: response.data.isScheduled ? response.data.plan : response.data.plan,
                scheduledPlan: response.data.isScheduled ? response.data.scheduledPlan : null,
                isSelectedPlan: 1
              })
            }
          })
        }
      }
    }, function () {
      utils.modalPopup(popupType, 'show', _this);
    });
  }

  cancelSubscription(cancel_active) {
    let _this = this;
    if(cancel_active){
      let popupType = constant['POPUP_TYPES']['CHANGE_PLAN'];
      _this.setState({
        modalPopupObj: {
          type: popupType,
          textarea: true,
          noBtnText: 'Cancel',
          yesBtnText: 'Proceed',
          iconImgUrl: constant['IMG_PATH'] + 'svg-images/negative-alert-icon.svg',
          msg: constant['POPUP_MSG']['CANCEL_SUBSCRIPTION'],
          noBtnAction: function () {
            utils.modalPopup(popupType, 'hide', _this);
          },
          yesBtnAction: function (msg) {
            utils.modalPopup(popupType, 'hide', _this);
            utils.apiCall('CANCEL_SUBSCRIPTION', {
              data: {
                cancel_active: cancel_active,
              }
            }, function (err, response) {
              if (err) {
                utils.flashMsg('show', err.response.data.error.message);
              } else {
                utils.flashMsg('show', constant['MESSAGES']['SUBSCRIPTION_SUCCESSFULLY_CANCELED']);
                let userData = utils.getCurrentUser();
                if (userData) {
                  userData.subscription_status = 0;
                  userData.poster_plan_id = null;
                  cookieManager.setObject('currentUser', userData);
                }
                _this.setState({
                  subscribedPlan: response.data.plan,
                  isSelectedPlan: 2,
                  scheduledPlan: null
                })
              }
            })
          }
        }
      }, function () {
        utils.modalPopup(popupType, 'show', _this);
      });
    }else{
      utils.apiCall('CANCEL_SUBSCRIPTION', {
        data: {
          cancel_active: cancel_active,
        }
      }, function (err, response) {
        if (err) {
          utils.flashMsg('show', err.response.data.error.message);
        } else {
          let userData = utils.getCurrentUser();
          if (userData) {
            userData.subscription_status = 1;
            userData.poster_plan_id = response.data.plan['plan_id'];
            cookieManager.setObject('currentUser', userData);
          }
          utils.flashMsg('show', constant['MESSAGES']['SUBSCRIPTION_SUCCESSFULLY_REACTIVATED']);
          _this.setState({
            subscribedPlan: response.data.plan,
            isSelectedPlan: 1,
            scheduledPlan: null
          })
        }
      })
    }
  }

  cancelScheduledSubscription(id) {
    let _this = this;
    let popupType = constant['POPUP_TYPES']['CHANGE_PLAN'];
    _this.setState({
      modalPopupObj: {
        type: popupType,
        textarea: true,
        noBtnText: 'Cancel',
        yesBtnText: 'Proceed',
        iconImgUrl: constant['IMG_PATH'] + 'svg-images/negative-alert-icon.svg',
        msg: constant['POPUP_MSG']['CANCEL_SCHEDULED_PLAN'],
        noBtnAction: function () {
          utils.modalPopup(popupType, 'hide', _this);
        },
        yesBtnAction: function (msg) {
          utils.modalPopup(popupType, 'hide', _this);
          utils.apiCall('CANCEL_SCHEDULED_PLAN', {data: {subscription_id:id}}, function (err, response) {
            if (err) {
            } else {
              if(response.data.isSuccess) {
                _this.setState({
                  scheduledPlan: null
                }); 
              }
            }
          })  
        }
      }
    }, function () {
      utils.modalPopup(popupType, 'show', _this);
    });    
  }

  backRouter(e){
    e.preventDefault();
    this.props.router.push(cookieManager.getObject('subscriptionBackUrl'));
  }

  render() {
    const { subscribedPlan, subscribePlans, isSelectedPlan, scheduledPlan } = this.state;
    let unix_timestamp = scheduledPlan !=null ? scheduledPlan.next_billing_at : 0;
    let date = new Date(unix_timestamp * 1000);
    const year = date.getFullYear();
    const month = constant['CALENDAR_MONTH'][date.getMonth()];
    const day = date.getDate();

    const monthlyPlanList = subscribePlans.map((s, key) => {
      let _price = s.plan.price;
      let _planId = s.plan.id;
      return (!s.plan.id.includes("premium") && s.plan.period_unit == "month") && <div className="col-lg-3 col-md-3 col-sm-6 col-xs-12" key={key}>
              <div className="card subscription-card">
                <div style={{ height: '100px' }}>
                  <h2 className="mt-2"><strong>{s.plan.name}</strong></h2>
                  <h3>
                    <span className="amount">${s.plan.price * 0.01}</span> {constant['SUBSCRIPTION_SUBTITLE_MONTH']}
                  </h3>
                </div>
                <div className="separator"></div>
                <ul className="features">
                  {s.plan.description}  
                </ul>
                {
                  isSelectedPlan == 0 ? <button className="btn btn-primary" onClick={() => this.gotoCheckOut(_planId)}>
                    Select Plan
                  </button> : subscribedPlan.plan_unit_price != _price ? <button className="btn btn-primary" onClick={() => this.updatePlan(_planId, _price)}>
                    Select Plan
                  </button> : isSelectedPlan == 1 ? <button className="btn btn-success selected-btn" disabled={false}  onClick={() => this.cancelSubscription(true)}>
                    Cancel Selected Plan
                  </button> : <button className="btn btn-primary reactivate-btn" onClick={() => this.cancelSubscription(false)}>
                    Reactivate Plan
                  </button>
                }
              </div>
            </div>;
    });

    const yearlyPlanList = subscribePlans.map((s, key) => {
      let _price = s.plan.price;
      let _planId = s.plan.id;
      return (!s.plan.id.includes("premium") && s.plan.period_unit == "year") && <div className="col-lg-3 col-md-3 col-sm-6 col-xs-12" key={key}>
              <div className="card subscription-card">
                <div style={{ height: '100px' }}>
                  <h2 className="mt-2"><strong>{s.plan.name}</strong></h2>
                  <h3>
                    <span className="amount">${s.plan.price * 0.01}</span> {constant['SUBSCRIPTION_SUBTITLE_YEAR']}
                  </h3>
                </div>
                <div className="separator"></div>
                <ul className="features">
                  {s.plan.description}  
                </ul>
                {
                  isSelectedPlan == 0 ? <button className="btn btn-primary" onClick={() => this.gotoCheckOut(_planId)}>
                    Select Plan
                  </button> : subscribedPlan.plan_unit_price != _price ? <button className="btn btn-primary" onClick={() => this.updatePlan(_planId, _price)}>
                    Select Plan
                  </button> : isSelectedPlan == 1 ? <button className="btn btn-success selected-btn" disabled={false}  onClick={() => this.cancelSubscription(true)}>
                    Cancel Selected Plan
                  </button> : <button className="btn btn-primary reactivate-btn" onClick={() => this.cancelSubscription(false)}>
                    Reactivate Plan
                  </button>
                }
              </div>
            </div>;
    });

    return (
      <div className="pricing-page">
        <div className="pricing-content">
          <div className="section-head" style={{ marginTop: 40 }}>
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">
                <Link to={'/'} onClick={this.backRouter}><i className="fa fa-chevron-left"/> Back To the Previous Page</Link>
              </li>
            </ol>
          </div>
          <div className="row" style={{ marginTop: 40 }}>
            <div className="col-lg-2" />
            <div className="col-lg-8">
              <h1 className="text-center text-primary"><strong>Select a Plan That Works for You</strong></h1>
            </div>
            <div className="col-lg-2">
              <div className="manage-account">Click <a href="javascript:void(0)" data-cb-type="portal" ><strong>here</strong></a> to manage account
                <span className="tip-text">You can manage billing & shipping addresses, payment methods and coupon code here.</span>
              </div>
            </div>
          </div>
          <Tabs>
            <TabList className={"subscription-tab-item-container"}>
              <Tab className={"subscription-tab-item"}>Monthly Plan</Tab>
              <Tab className={"subscription-tab-item"}>Annual Plan</Tab>
            </TabList>
            <div className="row" style={{ marginTop: "30px" }}>
              <TabPanel>
                {
                  monthlyPlanList
                }
              </TabPanel>
              <TabPanel>
                {
                  yearlyPlanList
                }
              </TabPanel>
            </div>
          </Tabs>
          {
            scheduledPlan != null ? <div className="row" style={{ marginTop: 30, textAlign: 'center' }}>
                              <p><span style={{color: "#3270b2", fontWeight: "bold"}}>{scheduledPlan.plan_id.toUpperCase().replaceAll("-", " ")}</span> is scheduled for change on next renewal on <span style={{color: "#3270b2"}}>{month + " " + day + ", " + year }</span></p>
                              <button className="btn yellow-btn" style={{ fontSize: 18, padding: '5px 30px' }} onClick={() => this.cancelScheduledSubscription(subscribedPlan.subscription_id)}>
                                Cancel My Scheduled Subscription
                              </button>
                            </div> : null
          }
        </div>
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
        {!this.state.token && <LegablyLargeFooter />}
      </div>
    );
  }
}
