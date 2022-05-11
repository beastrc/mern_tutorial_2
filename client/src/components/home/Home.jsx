import React from 'react';
import axios from 'axios';
import { Link, browserHistory } from 'react-router';
let classNames = require('classnames');

import { LegablyLargeFooter } from '../index';
import { config, constant, cookieManager, helper, utils } from '../../shared/index';
import ModalPopup from '../shared/modal-popup/ModalPopup';

const managedServicesText = [
  "If you'd like a little help getting started, Legably offers managed services using our network of vetted attorneys. Contact us, answer a few questions about your project, and we will post it to the Legably platform.",
  "Once your job is posted we will search our network to find the attorneys best suited for your project. With your approval we will hire the attorney of your choice and manage your project to completion.",
  "Managed services are free to use—we only get paid after you hire an attorney to handle your project and the work has been completed successfully.",
]
const managedServicesContactUsInfo = "\
  mailto:info@legably.com\
  ?subject=Tell Us About Your Project\
  &bcc=dreilly@legably.com\
  &body=Please replace this text with a brief description about your project and any other information that would help us narrow down a list of candidates like practice areas, states licensed, and any other specific requirements. The more information you can provide the better. Once we receive and review this information, someone from our Managed Services team will be in touch to get the process started.\
  ";

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      emailError: '',
      emailValid: false,
      is_seeker_profile_completed: false,
      is_poster_profile_completed: false,
      modalPopupObj: {},
      scrollTop: 0,
      userName: '',
      firmName: '',
      showDemoModel: true,
      showLoader: false
    };
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleInputOnBlur = this.handleInputOnBlur.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.changeUrl = this.changeUrl.bind(this);
    this.onGetStartedKeyUp = this.onGetStartedKeyUp.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.moveToTop = this.moveToTop.bind(this);
    this.myChangeHandler = this.myChangeHandler.bind(this);
    this.mySubmitHandler = this.mySubmitHandler.bind(this);
    this.toggleStage = this.toggleStage.bind(this);
    // this.showLoader =  this.showLoader.bind(this);
  }

  componentDidMount() {
    var userData = utils.getCurrentUser();
    if (userData) {
      this.setState({
        is_seeker_profile_completed: userData.is_seeker_profile_completed,
        is_poster_profile_completed: userData.is_poster_profile_completed
      });
    }
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll(event) {
    let target = event.srcElement || event.target;
    this.setState({
      scrollTop: target.body.scrollTop
    });
  }

  moveToTop() {
    var doc = document.documentElement;
    var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    if (top > 0) {
      window.scrollTo(0, top - 25);
      setTimeout(this.moveToTop, 5);
    }
  }

  changeUrl(url) {
    browserHistory.push({
      pathname: url,
      state: { email: this.state.email }
    });
  }

  onGetStartedKeyUp(evt) {
    if (evt.keyCode == 13 || evt.which == 13) {
      this.handleClick();
    }
  }

  handleUserInput(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleInputOnBlur(e) {
    this.setState({ [e.target.name]: e.target.value });
    if (e.target.value) {
      this.state.emailValid = e.target.value.match(/^(\s*[\w-+\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}\s*|[0-9]{1,3}\s*)(\]?)$/);
      this.state.emailError = this.state.emailValid ? '' : constant.INVALID_EMAIL_ADD;
      this.setState({ emailError: this.state.emailError, emailValid: this.state.emailValid })
    } else {
      this.setState({ emailError: constant.ENTER_EMAIL, emailValid: false })
    }
  }

  handleClick() {
    if (this.state.email) {
      this.state.emailValid = this.state.email.match(/^(\s*[\w-+\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}\s*|[0-9]{1,3}\s*)(\]?)$/);
      this.state.emailError = this.state.emailValid ? '' : constant.INVALID_EMAIL_ADD;
      this.setState({ emailError: this.state.emailError, emailValid: this.state.emailValid })
    } else {
      this.setState({ emailError: constant.ENTER_EMAIL, emailValid: false })
    }

    if (this.state.emailValid) {
      this.changeUrl(constant['ROUTES_PATH']['SIGN_UP']);
    }
  }

  movePage(ev, url) {
    ev.preventDefault();
    let routesPath = constant['ROUTES_PATH'];
    if(this.props.session) {
      if (url === routesPath['PROJECT_SEARCH']) {
        if (!this.state.is_seeker_profile_completed) {
          helper.openIncompleteProfilePopup(this, 'seeker');
          return;
        }
      } else if (url === routesPath['POST_JOB']) {
        if (!this.state.is_poster_profile_completed) {
          helper.openIncompleteProfilePopup(this, 'poster');
          return;
        }
      }
      utils.changeUrl(url);
    }else{
      utils.changeUrl(routesPath['SIGN_IN'])
    }
  }

  mySubmitHandler(event)  {
    let apiConfig = config.getConfiguration();

    this.setState({showLoader:true});

    event.preventDefault();
    let objToSend = {
      userName: this.state.userName,
      email: this.state.email,
      firmName: this.state.firmName
    }

    axios.post(apiConfig.API_ENDPOINT + "/bookDemo", objToSend)
    .then((response) => {
      this.setState({showLoader:false});
      this.setState({showDemoModel:false});
    }

    )

  }

  toggleStage(){
    this.setState({showDemoModel:true});
  }

  //  showLoader() {
    
  //   console.log('i am here --------', this.state.showLoader);
  //   if (this.state.showLoader) {
  //     return (
  //       <div>
  //         <img src={constant['IMG_PATH'] + 'loadern.gif'} alt="loader" />
  //       </div>
  //      );
  //   }
  // }

  myChangeHandler (event)  {

    let nam = event.target.name;
    let val = event.target.value;

    // this.state.userName =  event.target.value
    // this.setState({userName: event.target.value});
    this.setState({[nam]: val});
  }

  render() {
    let routesPath = constant['ROUTES_PATH'];
    var partenerClass = classNames({
      'right-div col-sm-6': true,
      'col-sm-offset-3': this.props.session
    });

    let scrollClass = classNames({
      'move-to-top': true,
      'd-block': this.state.scrollTop > 350
    });

    return (
      <div className="bg-white">
        <div className="home-page-wrapper">
          <div className="banner">
            <div className="container">
              <div className="banner-content">
                <div className="banner-content-inner">
                  <h4>Connecting <span>lawyers</span> with referrals and <span>freelance</span> projects.</h4>
                  <p>Legably is the top network of <span>freelance</span> project attorneys <br></br>for law firms, in-house legal teams, legal staffing firms, and companies.</p>
                  {
                    // this.props.session ?
                      <div className="relative mt-15 d-flex align-items-end h-100">
                        <button className="transy-btn yellow-btn mr-10" type="button" onClick={(ev) => this.movePage(ev, routesPath['POST_JOB'])}> I want to hire remote project attorneys </button><br/>
                        <button className="transy-btn" type="button" onClick={(ev) => this.movePage(ev, routesPath['PROJECT_SEARCH'])}> I’m an attorney looking for projects and referrals </button>
                      </div>
                      // :
                      // <div className="relative">
                      //   <div className={this.state.emailError !== '' ? "input-group global-error" : "input-group"}>
                      //     <input type="text" className="form-control" placeholder="Enter your email" name="email" value={this.state.email} onBlur={this.handleInputOnBlur} onChange={this.handleUserInput} onKeyUp={this.onGetStartedKeyUp} 
                      //       style={{width:'300px'}}
                      //     />
                      //     <span className="input-group-btn">
                      //       <button className="btn btn-secondary" type="button" onClick={this.handleClick}>Get Started!</button>
                      //     </span>
                      //   </div>
                      //   <p className="error"><span>{this.state.emailError !== '' ? this.state.emailError : ''}</span></p>
                      // </div>
                  }
                  {
                    // this.props.session ?
                    //   null
                    //   :
                    //   <p>Already have a Legably account? <span onClick={() => this.changeUrl(routesPath['SIGN_IN'])}>Sign-In</span></p>
                  }
                  </div>
                </div>
              </div>
            </div>

          <section className="spacer container sectionOneDesc">

            <div className="row">
              <div className="image  col-md-4">
                <img src={constant['IMG_PATH'] + 'computerGuy.png'} className="img img-fluid" alt="computer guy" />
              </div>
              <div className="imagetext col-md-8">
                <p>
                  If you are interested in learning more <br></br>about posting projects and hiring <br></br>attorneys using Legably <br></br>
                  <button type="button" className="btn btn-primary btn-bookaDemoModel" data-toggle="modal" data-target="#bookaDemoModel">
                    Book a Demo
                  </button>
                </p>
                {/* <!-- Modal --> */}
                <div className="modal fade" id="bookaDemoModel" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                  <div role="document" className={(!this.state.showDemoModel ? 'show-ThankYou modal-dialog' : 'modal-dialog')}>
                    <div className="modal-content">
                        <button type="button"  onClick={ this.toggleStage} className="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                        { this.state.showDemoModel &&
                      <div className="modal-body text-center">
                        <div className="legably-partner-block"> 
                          <img className="legably-partner-img" src={constant['IMG_PATH'] + 'legably-partner-responsive.png'}  alt=""/>
                        </div>
                       
                            <div  className="le-form-block text-center"> 
                            <form className="le-form-inner"  onSubmit={this.mySubmitHandler} method= 'post'>
                              <div className="form-group">
                                {/* <label for="username">User Name</label> */}
                                <input type="text" className="form-control" required name='userName' onChange={this.myChangeHandler} id="username" placeholder="Name"/>
                              </div>
                              <div className="form-group">
                                {/* <label for="email">Email address</label> */}
                                <input type="email" className="form-control" required id="email" name='email' onChange={this.myChangeHandler} aria-describedby="emailHelp" placeholder="Enter email"/>
                                {/* <small id="emailHelp" className="form-text text-muted">We'll never share your email with anyone else.</small> */}
                              </div>
    
                              <div className="form-group">
                                {/* <label for="firmName">Business or Firm name</label> */}
                                <input type="text" className="form-control" required name='firmName' onChange={this.myChangeHandler} id="firmName" aria-describedby="firmNameHelp" placeholder="Business or Firm name"/>
                              </div>
                              
                              <button className="btn-book-a-demo" type="submit" disabled={this.state.showLoader}className="btn btn-primary">Book A Demo</button>
                            </form>
                          </div>
                         
                        </div>
                         
                          }
                         {
                          this.state.showLoader ?
                          <div className="loader">
                           <img src={constant['IMG_PATH'] + 'loadern.gif'} alt="loader" />
                          </div>

                        : 

                        <div className={(!this.state.showDemoModel ? 'show ThankYou-block' : 'hidden')}> 
                          <img src={constant['IMG_PATH'] + 'ThankYou.png'}  alt=""/>
                            <p className="text-center">
                              for submitting your message. A member of our team will be in touch shortly to setup a demonstration
                            </p>

                        </div>
                        }
                        
                        
                          
                               
                          
                      {/* <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" className="btn btn-primary">Book A Demo</button>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </section>

          <section className="spacer spacer2 container floaterContainer">
            <div className="row floater">
                <div className="col-md-4 floater-col">
                  <div className="card">
                    <img className="card-img-top" src={constant['IMG_PATH'] + 'edit.png'} alt="Card image cap"/>
                      <div className="card-body">
                        <h5 className="card-title">Work On Your Terms</h5>
                        <p className="card-text">Legably gives attorneys seeking freelance (hourly- or project-based) work the opportunity to find great on-site and remote jobs that match their skill-set, interests, and availability. Whether you’re interested in working as a full-time freelancer or supplementing income from your existing position, Legably is the place to be.</p>
                      </div>
                  </div>
                </div>

                <div className="col-md-4 floater-col">
                  <div className="card">
                    <img className="card-img-top" src={constant['IMG_PATH'] + 'handshake.png'} alt="Card image cap"/>
                      <div className="card-body">
                        <h5 className="card-title">Connect Directly</h5>
                        <p className="card-text">The Legably platform facilitates a direct connection between attorneys seeking work and attorneys and firms in need of their services—allowing both parties to get to work quickly and avoid the headaches, inefficiencies, and high-fees associated with traditional legal staffing agencies and hiring processes.</p>
                      </div>
                  </div>
                </div>

                <div className="col-md-4 floater-col">
                  <div className="card">
                    <img className="card-img-top" src={constant['IMG_PATH'] + 'graph.png'} alt="Card image cap"/>
                      <div className="card-body">
                        <h5 className="card-title">Grow Your Practice</h5>
                        <p className="card-text">Legably gives attorneys and firms the ability to handle more clients, generate more revenue, and grow their practices without the overhead and risk associated with hiring a full-time employee by providing access to on-demand services from highly skilled attorneys specializing in a wide-variety of practice areas across the U.S.</p>
                      </div>
                  </div>
                </div>

              </div>

              
          </section>

          <section className="spacer container howItWorked" id="how-it-works">
            <h3 className="text-center">How It Works</h3>
            <p>Attorneys on the Legably network are vetted to ensure that they are licensed and in good standing in at least one US jurisdiction. There are several thousand attorneys from all fifty states presently on the Legably platform ready to help you tackle your next legal project.</p>
          </section>


        <section className="spacer container what-we-offer">
          <div className="row">
            <div className="left-div col-lg-12">
              <h3 className="text-center" >What We Offer</h3>
              <div className="row">
                <div className="col-lg-3  col-md-3 card-padding">
                  <div className="card how-card">
                    <h4>Post a Project</h4>
                    <p>Post a project on the platform identifying your specific needs, geographic requirements, minimum level of experience, and other criteria.</p>
                    <div className="arrow"/>
                  </div>
                </div>
                <div className="col-lg-3  col-md-3 card-padding">
                  <div className="card how-card">
                    <h4>Hire an Attorney</h4>
                    <p>Attorneys who meet your criteria will be notified and will begin applying to your project. Additionally, you may search through our network of attorneys to invite specific candidates to apply to your project.</p>
                    <div className="arrow"/>
                  </div>
                </div>
                <div className="col-lg-3  col-md-3 card-padding">
                  <div className="card how-card ">
                    <h4>Manage Your Project</h4>
                    <p>Easily transfer documents, message your attorney, and set specific deliverables or milestones for your attorney to meet. Follow the work in real time and pay either on a milestone basis or when the entire project is delivered.</p>
                    <div className="arrow"/>
                  </div>
                </div>
                <div className="col-lg-3 col-md-3 card-padding">
                  <div className="card how-card">
                    <h4>Complete Your Project</h4>
                    <p>Complete payment through the Legably platform for all work performed, and rate your attorney for the work they have completed. Legably takes care of all tax reporting for any contractor work performed, so you don’t have to.</p>
                  </div>
                </div>
              </div>
              
            </div>
            <div className="col-md-12">
              <p className="add-desc">
                Legably attorneys support your existing team or provide standalone legal support. Flexibly manage legal work requiring different practice specialties, state licensure, or other special requirements. Our pool of vetted attorneys are ready today to support your practice, in-house legal team, or legal staffing firm with your needs.
              </p>
            </div>
          </div>
        </section> 

        
        <section className="get-started container-fluid">
            <div className="container">
              <div className="row">
                {!this.props.session ?
                  <div className="left-div col-sm-6">
                    <div className="row vr-saperator separator mr-0">
                      <div className="col-sm-10 p-0">
                        <h4>Get Started Today</h4>
                        <p>Sign-up today for free and start exploring great opportunities or finding the attorneys you need to grow your practice. </p>
                        <button type="button" onClick={() => this.changeUrl(routesPath['SIGN_UP'])}>Get Started</button>
                      </div>
                    </div>
                  </div>
                  : ''
                }

                <div className={partenerClass}>
                  <div className="row mr-0">
                    <div className="col-sm-10 col-sm-offset-1 ">
                      <h4>PARTNERS</h4>
                      <p>Legably is the preferred legal staffing solution for users of Clio, a leading global legal practice management software provider. </p>
                      <Link><img src="images/legably-partner-responsive.png" alt="legably" /></Link>
                      <span>+</span>
                      <Link><img src="images/clio-logo-responsive.png" /></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <a className={scrollClass} onClick={this.moveToTop} href="#!">
              <i className="fa fa-long-arrow-up" aria-hidden="true"></i>
            </a>
          </section>

          <ModalPopup modalPopupObj={this.state.modalPopupObj} />
        </div>
        {!this.props.session && <LegablyLargeFooter />}
      </div>
    );
  }
}
