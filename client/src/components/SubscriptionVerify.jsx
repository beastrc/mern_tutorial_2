import React from 'react';
import { constant, utils, sessionManager, cookieManager } from '../shared/index';

export default class SubscriptionVerify extends React.Component {
	constructor(props) {
    super(props);
    this.state = {
      isSession: false
    };
    this.checkSession = this.checkSession.bind(this);
  }

  componentDidMount() {
  	this.setState({isSession : sessionManager.isSession()}, function(){
		  this.checkSession();
    });
  }

  checkSession() {
    if (this.state.isSession) {
      var userData = utils.getCurrentUser();
      if(!userData.subscription_status){
        cookieManager.setObject('subscriptionBackUrl', this.props.location.pathname);
        setTimeout(function() {
          utils.changeUrl(constant['ROUTES_PATH']['SUBSCRIPTIONS']);
        }, 0);
      }
    } else {
      setTimeout(function() {
        utils.changeUrl(constant['ROUTES_PATH']['SIGN_IN']);
      }, 0);
    }
  }

  render() {
    const { children } = this.props;
    var childrenWithProps = React.Children.map(children, child =>
      React.cloneElement(child, { forceUpdateHeader: this.props.forceUpdateHeader }));
    return (this.state.isSession) ? <div>{childrenWithProps}</div> : null;
  }
}
