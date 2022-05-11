import React from 'react';
import { Link } from 'react-router';
import { Link as Scroll } from 'react-scroll';
import IconButton from '../iconButton';
import Socket from '../../../shared/socket';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import ReactNotifications from 'react-browser-notifications';


let Dropdown, MenuItem;
let classNames = require('classnames');

import {
  constant,
  helper,
  utils,
  cookieManager,
  sessionManager
} from '../../../shared/index';
import ModalPopup from '../modal-popup/ModalPopup';

export default class LegablyHeader extends React.Component {
  constructor(props) {
    super(props);
    this.routesPath = constant['ROUTES_PATH'];
    this.state = {
      first_name: '',
      last_name: '',
      token: '',
      photo: '',
      currentPage: props.currentPage,
      role: '',
      is_seeker_profile_completed: false,
      is_poster_profile_completed: false,
      modalPopupObj: {},
      stripe_dashboard_link: '',
      webNoti:{body:"body", title:"legably" }
    };
    this.profileImgError = this.profileImgError.bind(this);
    this.onLegablyLogoClick = this.onLegablyLogoClick.bind(this);
    this.onBriefcaseIconClick = this.onBriefcaseIconClick.bind(this);
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.setHeaderContent();
    sessionManager.isSession() && this.checkStripeAccountAndGetDashboardLink();
    var _this = this;
    if(Socket.io()){
      Socket.io().registerPushHandler(data => {
        if(data.mode == 'notify'){
          let title = "Message from " + data.name;
          let content = data.msg;
          let seconds = 10000;
          if(this.n.supported()){
            this.setState({webNoti: {body:title ,title:content}},()=>{
              this.n.show();
            })
          } 
          var cb = ()=>{
            utils.changeUrl(constant['ROUTES_PATH']['CHAT']);
          }
          switch(data.type){
            case 'info':
              NotificationManager.info(content, title, seconds, cb);
              break;
            case 'success':
              NotificationManager.success(content, title, seconds, cb);
              break;
            case 'warning':
              NotificationManager.warning(content, title, seconds, cb);
              break;
            case 'error':
              NotificationManager.error(content, title, seconds, cb);
              break;
          } 
        }
      })
    }
  }
  componentWillUnmount(){
    if(Socket.io()){
      Socket.io().unregisterPushHandler();
    }
  }
  componentWillReceiveProps(nextProps) {
    this.setHeaderContent();
    this.setState({
      currentPage: nextProps.currentPage
    });
  }

  checkStripeAccountAndGetDashboardLink() {
    let that = this;
    utils.apiCall('GET_STRIPE_DASHBOARD_LINK', { data: {} }, function (
      err,
      response
    ) {
      if (err) {
        utils.flashMsg('show', 'Error while getting stripe dashboard link');
        utils.logger('error', 'Get Stripe Dashboard Link Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          that.setState({
            stripe_dashboard_link: utils.getDataFromRes(response, 'url')
          });
        }
      }
    });
  }

  setHeaderContent() {
    var userData = utils.getCurrentUser();
    if (userData) {
      let userImage = userData.image || '';
      this.setState({
        first_name: userData.first_name,
        last_name: userData.last_name,
        availability_type: userData.availability_type,
        token: userData.token,
        photo: userImage,
        role: utils.getUserRole(),
        is_seeker_profile_completed: userData.is_seeker_profile_completed,
        is_poster_profile_completed: userData.is_poster_profile_completed
      });
    }
  }

  profileImgError(evt) {
    return utils.onImgError(evt, '/images/default-profile-pic.png');
  }

  signOut() {
    utils.apiCall('SIGN_OUT', {}, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error in Sign Out');
        utils.logger('error', 'Sign Out Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          utils.logout();
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
    });
  }

  componentWillMount() {
    Dropdown = require('react-bootstrap').Dropdown;
    MenuItem = require('react-bootstrap').MenuItem;
  }

  moveToPostOrFindJobSection(url) {
    if (this.props.session) {
      if (url === this.routesPath['PROJECT_SEARCH']) {
        if (!this.state.is_seeker_profile_completed) {
          helper.openIncompleteProfilePopup(this, 'seeker');
          return;
        }
      } else if (url === this.routesPath['POST_JOB']) {
        if (!this.state.is_poster_profile_completed) {
          helper.openIncompleteProfilePopup(this, 'poster');
          return;
        }
      }
    }
    this.movePage(url);
  }

  openPage(url) {
    window.open(url, '_blank');
  }

  movePage(url) {
    helper.closeLeftPanel();
    if (!this.props.session) {
      cookieManager.set('redirectionPage', url);
      url = this.routesPath['SIGN_IN'];
    }
    utils.changeUrl(url);
  }

  isEitherOneProfileCompleted() {
    return (
      this.state.is_seeker_profile_completed ||
      this.state.is_poster_profile_completed
    );
  }

  onLegablyLogoClick(evt) {
    helper.closeLeftPanel();
    utils.goToHome();
  }

  onBriefcaseIconClick(evt) {
    evt.preventDefault();
    helper.closeLeftPanel();
    if (this.state.is_seeker_profile_completed) {
      utils.changeUrl(this.routesPath['PROJECT_SEARCH']);
    } else if (this.state.is_poster_profile_completed) {
      utils.changeUrl(this.routesPath['MY_POSTED_JOBS']);
    }
  }

  isHomePage(currentPage) {
    return currentPage === this.routesPath['HOME'];
  }

  renderDropdownButton(title) {
    let eitherOneProfileCompleted = this.isEitherOneProfileCompleted();
    let stripeDashboardLink = this.state.stripe_dashboard_link;

    return (
      <Dropdown bsStyle="default" id={`dropdown-basic-primary`}>
        <Dropdown.Toggle bsStyle="default" noCaret={false}>
          <span className="user-name">{title} </span>{' '}
          <span className="caret"></span>
        </Dropdown.Toggle>
        {this.state.role === 'admin' ? (
          <Dropdown.Menu className="super-colors">
            <MenuItem eventKey="4" onClick={() => this.signOut()}>
              <i className="fa fa-sign-out" aria-hidden="true"></i>Sign Out
            </MenuItem>
          </Dropdown.Menu>
        ) : (
            <Dropdown.Menu className="super-colors">
              {
                eitherOneProfileCompleted ?
                  <MenuItem eventKey="1" onClick={() => this.movePage(this.routesPath['PROFILE'] + '/attorney')}>
                    <i className="fa fa-user-circle-o" aria-hidden="true"></i>Attorney Profile
                  </MenuItem>
                  :
                  null
              }
              {
                eitherOneProfileCompleted ?
                  <MenuItem eventKey="2" onClick={() => this.movePage(this.routesPath['PROFILE'] + '/firm')}>
                    <i className="fa fa-user-circle-o" aria-hidden="true"></i>Firm Profile
                  </MenuItem>
                  :
                  null
              }
              {stripeDashboardLink != '' &&
                <MenuItem eventKey="5" onClick={() => this.openPage(stripeDashboardLink)}>
                  <i className="fa fa-window-restore" aria-hidden="true"></i>Payment Info
                  </MenuItem>
              }
              <MenuItem eventKey="5" onClick={() => this.movePage(this.routesPath['SUBSCRIPTIONS'])}>
                <i className="fa fa-window-restore" aria-hidden="true"></i>Subscription Info
              </MenuItem>
              <MenuItem eventKey="3" onClick={() => this.movePage(this.routesPath['CHANGE_PASSWORD'])}>
                <i className="fa fa-key" aria-hidden="true"></i>Change Password
            </MenuItem>
              <MenuItem eventKey="4" onClick={() => this.signOut()}>
                <i className="fa fa-sign-out" aria-hidden="true"></i>Sign Out
            </MenuItem>
            </Dropdown.Menu>
        )}
      </Dropdown>
    );
  }

  render() {
    let isTransHeader = this.props.isTransHeader;
    let homePageClass = '',
      transButton = 'yellow-btn';
    if (isTransHeader == true) {
      homePageClass = 'trans-header';
      transButton = 'transy-btn';
    } else {
      homePageClass = 'mt-70';
    }
    let logoImage = this.props.logoImage;
    let eitherOneProfileCompleted = this.isEitherOneProfileCompleted();
    let isHomePage = this.isHomePage(this.state.currentPage);

    // console.log("isHomePage",isHomePage,  "this.props.session",this.props.session , "this.state.role",this.state.role,  "eitherOneProfileCompleted",eitherOneProfileCompleted);
    
    return (
      <div className="header-wrapper">
        <header
          className={
            'static-page-header home-page-header hidden-xs-down ' +
            homePageClass
          }
        >
          <nav className="navbar navbar-fixed-top">
            <div className="container-fluid row mt-15">
              <div className="navbar-header m-0 col-md-2 col-xs-4 p-0">
                <a className="navbar-brand" href="javascript:void(0);">
                  <img
                    onClick={this.onLegablyLogoClick}
                    src={logoImage}
                    alt="logo"
                  />
                </a>
              </div>
              {this.props.session && !isHomePage ?
                <div className="col-md-10 col-xs-8">
                  <div className="row">
                    
                    <div className="navbar-right-wraper col-md-10 col-xs-4 col-sm-5 pull-right">
                      <ul className="pull-right menus">
                        {
                          this.state.role !== 'admin' ?
                          eitherOneProfileCompleted ?
                            <li className="briefcase mr-15">
                              <Link to={constant['ROUTES_PATH']['NETWORK']}>
                                <IconButton key="info" icon="ion-ios-person-add" />
                                <span className="mywork">My Network</span>
                              </Link>
                            </li>
                            :
                            null
                          :
                          null
                        }
                        {
                          this.state.role !== 'admin' ?
                            eitherOneProfileCompleted ?
                              <li className="briefcase mr-15">
                                <Link to={constant['ROUTES_PATH']['CHAT']}>
                                  <IconButton key="info" icon="ion-ios-chatbubbles" />
                                  <span className="mywork">Messaging</span>
                                </Link>
                              </li>
                              :
                              null
                            :
                            null
                        }
                        {
                          this.state.role !== 'admin' ?
                            eitherOneProfileCompleted ?
                              <li className="briefcase mr-20">
                                <Link onClick={this.onBriefcaseIconClick}>
                                  <IconButton key="info" icon="ion-ios-briefcase" />
                                  <span className="mywork">My Work</span>
                                </Link>
                              </li>
                              :
                              null
                            :
                            null
                        }
                        <li className="p-0 user-profile">
                          <span className={this.state.availability_type?"profile-pic" : "profile-pic avail-off"}>
                          <img src={this.state.photo ? this.state.photo : constant['IMG_PATH'] + 'default-profile-pic.png'} onError={this.profileImgError} /></span>
                          {this.renderDropdownButton(this.state.first_name + ' ' + this.state.last_name)}
                        </li>
                      </ul>
                      {this.props.session?(
                        ''
                      ):(
                      <ul className=" menus">
                        <li className="sign-in-up mr-20">
                          <Link to="/pricing">
                          <span className="sign-img Price-Tag">
                            <img className="img-fluid" src={constant['IMG_PATH'] + 'Price-Tag-01.png'} />
                          </span>
                          <span className="pricing-text">Pricing</span>
                          </Link>
                        </li>
                        <li className="sign-in-up">
                          {isHomePage?
                          (
                            <Scroll to="how-it-works" style={{cursor: 'pointer'}} activeClass="active" spy={true} smooth={true} offset={0} duration={500}>
                              <span className="sign-img how-work">
                                    <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                                  </span> 
                                  <span className="pricing-text">How It Works</span>
                            </Scroll>
                          ):(
                            <a href="/#how-it-works" target="_blank">
                               <span className="sign-img how-work">
                                    <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                                  </span> 
                                  <span className="pricing-text">How It Works</span>
                            </a>
                          )}
                        </li>
                      </ul>
                      )}
                    </div>
                  </div>
                </div>
                :
                <div className="navbar-right-wraper col-md-10 col-xs-8 pull-right text-right">
                  <div className="row m-0">

                    <div className="navbar-right-wraper col-md-10 col-xs-4 col-sm-5 pull-right text-right">
                      
                      {
                        isHomePage && this.props.session ?
                          <ul className="pull-right menus">
                            {
                              this.state.role !== 'admin' ?
                                eitherOneProfileCompleted ?
                                  <li className="briefcase mr-15">
                                    <Link to={constant['ROUTES_PATH']['NETWORK']}>
                                    <IconButton key="info" icon="ion-ios-person-add" />
                                    <span className="mywork">My Network</span>
                                    </Link>
                                  </li>
                                  :
                                  null
                                :
                                null
                            }
                            {
                              this.state.role !== 'admin' ?
                                eitherOneProfileCompleted ?
                                  <li className="briefcase mr-15">
                                    <Link to={constant['ROUTES_PATH']['CHAT']}>
                                    <IconButton key="info" icon="ion-ios-chatbubbles" />
                                    <span className="mywork">Messaging</span>
                                    </Link>
                                  </li>
                                  :
                                  null
                                :
                                null
                            }
                            {
                              eitherOneProfileCompleted ?
                                <li className="briefcase mr-20">
                                  <Link onClick={this.onBriefcaseIconClick}>
                                    <IconButton key="info" icon="ion-ios-briefcase" />
                                    <span className="mywork">My Work</span>
                                  </Link>
                                </li>
                                :
                                null
                            }
                            <li className="user-profile-mobile p-0 dropdown">
                              <span className={this.state.availability_type?"profile-pic" : "profile-pic avail-off"}>
                              <img src={this.state.photo ? this.state.photo : constant['IMG_PATH'] + 'default-profile-pic.png'} onError={this.profileImgError} /></span>
                              {this.renderDropdownButton(this.state.first_name + ' ' + this.state.last_name)}
                            </li>
                          </ul>
                          :
                          <ul className="pull-right menus">
                            <li className="sign-in-up">
                              <Link to="/pricing">
                              <span className="sign-img Price-Tag">
                                <img className="img-fluid" src={constant['IMG_PATH'] + 'Price-Tag-01.png'} />
                              </span>
                                <span className="pricing-text">Pricing</span>
                              </Link>
                            </li>
                            <li className="sign-in-up">
                              {isHomePage?
                              (
                                <Scroll to="how-it-works" style={{cursor: 'pointer'}} activeClass="active" spy={true} smooth={true} offset={0} duration={500}>
                                  <span className="sign-img how-work">
                                    <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                                  </span> 
                                  <span className="pricing-text">How It Works</span>
                                </Scroll>
                              ):(
                                <a href="/#how-it-works" target="_blank">
                                   <span className="sign-img how-work">
                                      <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                                   </span> 
                                  <span className="pricing-text">How It Works</span>
                                </a>
                              )}
                            </li>
                            
                            <li className="sign-in-up">
                             
                              <Link to={this.routesPath['SIGN_IN']}><span className="siginintext"> Sign In</span>
                              <span className="sign-img">
                                  <img className="img-fluid" src={constant['IMG_PATH'] + 'Sign-In-01.png'} />
                                </span>
                              </Link>                              
                            </li>
                            <li className="sign-in-up">
                               <Link to={this.routesPath['SIGN_UP']}> <span className="siginintext"> Sign Up</span> 
                               <span className="sign-img">
                                  <img className="img-fluid" src={constant['IMG_PATH'] + 'Sign-Up-01.png'} />
                                </span>
                               </Link>
                            </li>
                          </ul>
                      }
                      
                      
                    </div>
                  </div>
                </div>
              }
            </div>
          </nav>
        </header>

        <header
          className={
            'mobile-header hidden-xs-up static-page-header ' + homePageClass
          }
        >
          <nav className="navbar navbar-fixed-top">
            <div className="container-fluid row m-0">
              <div className="navbar-header col-xs-3 m-0 p-0">
                <a className="navbar-brand" href="javascript:void(0);">
                  <img
                    id="legably_logo"
                    className="ml-0"
                    onClick={this.onLegablyLogoClick}
                    src={logoImage}
                    alt="logo"
                    width="160"
                  />
                </a>
              </div>
              <div className="navbar-mid-wraper col-xs-4 m-0 p-0">
                <button
                  onClick={() =>
                    this.moveToPostOrFindJobSection(this.routesPath['POST_JOB'])
                  }
                  className={ "mr-20 " + transButton }
                  type="button"
                >
                  {' '}
                  Post a Job{' '}
                </button>
                <button
                  onClick={() =>
                    this.moveToPostOrFindJobSection(this.routesPath['PROJECT_SEARCH'])
                  }
                  className={transButton}
                  type="button"
                >
                  {' '}
                  Find a Job{' '}
                </button>
              </div>
              <div className="navbar-right-wraper col-xs-6 pull-right">
                {this.props.session ? (
                  <ul className="pull-right">
                    {eitherOneProfileCompleted ? (
                      <li className="briefcase mr-5">
                        <Link to={constant['ROUTES_PATH']['NETWORK']}>
                          <IconButton key="info" icon="ion-ios-person-add" />
                          <span className="mywork">My Network</span>
                        </Link>
                      </li>
                    ) : null}
                    {eitherOneProfileCompleted ? (
                      <li className="briefcase mr-5">
                        <Link to={constant['ROUTES_PATH']['CHAT']}>
                          <IconButton key="info" icon="ion-ios-chatbubbles" />
                          <span className="mywork">Messaging</span>
                        </Link>
                      </li>
                    ) : null}
                    {eitherOneProfileCompleted ? (
                      <li className="briefcase mr-5">
                        <Link
                          onClick={this.onBriefcaseIconClick}
                        >
                          <IconButton key="info" icon="ion-ios-briefcase" />
                          <span className="mywork">My Work</span>
                        </Link>
                      </li>
                    ) : null}
                    <li className="p-0 dropdown">
                    <span className={this.state.availability_type?"profile-pic" : "profile-pic avail-off"}>
                        <img
                          src={
                            this.state.photo
                              ? this.state.photo
                              : constant['IMG_PATH'] + 'default-profile-pic.png'
                          }
                          onError={this.profileImgError}
                        />
                      </span>
                      {this.renderDropdownButton(
                        this.state.first_name + ' ' + this.state.last_name
                      )}
                    </li>
                  </ul>
                ) : (
                    <ul className="pull-right">
                      <li className="sign-in-up-2 mr-20">
                        <Link to="/pricing">
                          <span className="sign-img Price-Tag">
                            <img className="img-fluid" src={constant['IMG_PATH'] + 'Price-Tag-01.png'} />
                          </span> 
                          <span className="pricing-text">Pricing</span>
                        </Link>
                      </li>
                      <li className="sign-in-up">
                        {isHomePage?
                        (
                          <Scroll to="how-it-works" style={{cursor: 'pointer'}} activeClass="active" spy={true} smooth={true} offset={0} duration={500}>
                            <span className="sign-img how-work">
                                <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                              </span>  
                              <span className="pricing-text">How It Works</span>
                          </Scroll>
                        ):(
                          <a href="/#how-it-works" target="_blank">
                              <span className="sign-img how-work">
                                <img className="img-fluid" src={constant['IMG_PATH'] + 'How-It-Work-01.png'} />
                              </span> 
                              <span className="pricing-text">How It Works</span>
                                </a>
                        )}
                      </li>
                      <li>
                        <div className="signin-container-temp">
                          <Link to={this.routesPath['SIGN_IN']}>
                          <span className="siginintext"> Sign In</span>
                          <span className="sign-img">
                            <img className="img-fluid" src={constant['IMG_PATH'] + 'Sign-In-01.png'} />
                          </span>
                          </Link>
                        </div>
                      </li>
                      <li className="sign-in-up">
                        
                        <div className="signup-container-temp">
                          <Link to={this.routesPath['SIGN_UP']}> 
                            <span className="siginintext"> Sign Up</span> 
                            <span className="sign-img">
                              <img className="img-fluid" src={constant['IMG_PATH'] + 'Sign-Up-01.png'} />
                            </span>
                          </Link>
                        </div>
                      </li>
                    </ul>
                )}
                {/* {this.props.session?(
                  ''
                ):(
                <ul className="pull-right menus ml-15">
                  <li className="sign-in-up-2 mr-20">
                    <Link to="/pricing">
                      <span>Pricing</span>
                    </Link>
                  </li>
                  <li className="sign-in-up">
                    {isHomePage?
                    (
                      <Scroll to="how-it-works" style={{cursor: 'pointer'}} activeClass="active" spy={true} smooth={true} offset={0} duration={500}>
                        <span><i class="fa fa-user" aria-hidden="true"></i>How It Works</span>
                      </Scroll>
                    ):(
                      <a href="/#how-it-works" target="_blank">
                        <span><i class="fa fa-user" aria-hidden="true"></i> How It Works</span>
                      </a>
                    )}
                  </li>
                </ul>
                )} */}
              </div>
              <span className="clearfix"></span>
            </div>
          </nav>
          <div id="menu" className="mobile-menu">
            <ul className="mobile-ul">
              <li>
                <Link to={this.routesPath['SIGN_IN']}>
                  <span className="icon-edit-profile"></span>Sign-in
                </Link>
              </li>
              <li>
                <Link to={this.routesPath['SIGN_UP']}>
                  <span className="icon-change-password"></span>Sign-up
                </Link>
              </li>
            </ul>
          </div>
        </header>
        <NotificationContainer/>
        <ReactNotifications
          onRef={ref => (this.n = ref)} // Required
          title={this.state.webNoti.title} // Required
          body={this.state.webNoti.body}
          icon="/images/notification_mark.png"
          // tag={this.state.webNoti.title}
          onClick={event => {
            window.focus()
            window.location.replace(constant['ROUTES_PATH']['CHAT']);
            this.n.close(event.target.tag);
            //utils.changeUrl(constant['ROUTES_PATH']['CHAT']);
          }}
        />
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </div>
    );
  }
}
