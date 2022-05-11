import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';

import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js';

import { LegablyLargeFooter } from '../index';
import { constant, utils, config } from '../../shared/index';
import ModalPopup from '../shared/modal-popup/ModalPopup';
import CheckoutForm from './Form';



const CheckoutPage = (props) => {
  const planKey = props.params.plan

  const subscriptionInfo = constant['SUBSCRIPTION_TIERS'][planKey-1]

  let apiConfig = config.getConfiguration();
  const stripePromise = loadStripe(apiConfig.STRIPE_PUBLISHABLE_KEY);
  
  return (
  	<div className="pricing-page checkout-page">
      <div className="pricing-content">
        <div className="section-head">
          <ol className="breadcrumb">
            <li className="breadcrumb-item active">
              <Link to="/subscriptions"><i className="fa fa-chevron-left"/> Change My Plan</Link>
            </li>
          </ol>
        </div>
        <div className="card" style={{paddingBottom: 50}}>
          <div className="row">
            <div className="col-lg-5 border-right">
              <div className="subscription-card" style={{width: '70%', margin: '0 auto'}}>
                <h2><strong>{subscriptionInfo.title}</strong></h2>
                <h3>
                  <span className="amount">{subscriptionInfo.price}</span> {subscriptionInfo.subtitle}
                </h3>
                <ul className="features" style={{marginTop: 50}}>
                  {subscriptionInfo.details.map((dt, key1) => <li key={key1}>{dt}</li>)}
                </ul>
              </div>
            </div>
            <div className="col-lg-7">
              <Elements stripe={stripePromise}>
                <CheckoutForm planKey={planKey} planPrice={subscriptionInfo.price} {...props}/>
              </Elements>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default CheckoutPage
