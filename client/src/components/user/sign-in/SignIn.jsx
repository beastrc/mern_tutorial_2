import React from 'react';
import { Link, browserHistory} from 'react-router';

import { constant, helper, utils, cookieManager, sessionManager } from '../../../shared/index';
import ModalPopup from '../../shared/modal-popup/ModalPopup';


export default class SignIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      rememeberMe : false,
      formErrors: {email: '', password: ''},
      emailValid: false,
      passwordValid: false,
      formValid: false,
      showPass : false,
      modalPopupObj: {}
    };
    this._handleClick = this._handleClick.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleInputOnBlur = this.handleInputOnBlur.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.validateField = this.validateField.bind(this);
    this.showPassword = this.showPassword.bind(this);
  }

  componentDidMount() {
    window.scrollTo(0,0);
    if(cookieManager.get('rememeberMe')){
      let userData = {};
      userData = cookieManager.getObject('rememeberMe');
      userData.password = atob(userData.password);
      this.setState({rememeberMe : true , email : userData.email.toString() , password : userData.password.toString()});
      this.validateField('email', userData.email);
      this.validateField('password', userData.password);
    }
  }

  showPassword() {
    if(this.state.showPass){
      document.getElementById("pwd").setAttribute("type", "password");
      this.setState({
        showPass: false
      });
    }else{
      document.getElementById("pwd").setAttribute("type", "text");
      this.setState({
        showPass: true
      });
    }
  }

 _handleClick(e) {
    e.preventDefault();
    let fieldValidationErrors = this.state.formErrors;
    switch('email') {
      case 'email':
        if(!this.state.email){
          this.state.emailValid = false;
          fieldValidationErrors.email = this.state.emailValid ? '' : constant.ENTER_EMAIL;
        }
      case 'password':
        if(!!this.state.password){
          this.state.passwordValid = true;
          fieldValidationErrors.password = '';
        }else{
          this.state.passwordValid = false;
          fieldValidationErrors.password = this.state.passwordValid ? '': constant.ENTER_PASSWORD;
        }
        break;
      default:
        break;
    }

    this.setState({formErrors: fieldValidationErrors,
      emailValid: this.state.emailValid,
      passwordValid: this.state.passwordValid,
    }, this.validateForm);

    if(this.state.emailValid && this.state.passwordValid){
      var _this = this;
      const data = {
        email: _this.state.email.toLowerCase().trim(),
        password: _this.state.password
      };

      utils.apiCall('SIGN_IN', { 'data': data }, function(err, response) {
        if (err) {
          utils.flashMsg('show', 'Error in Sign In');
          utils.logger('error', 'Sign In Error -->', err);
        } else {
          if (utils.isResSuccess(response)) {
            if (_this.state.rememeberMe) {
              cookieManager.setObject('rememeberMe', {email: data.email, password: btoa(_this.state.password)});
            } else {
              cookieManager.clear('rememeberMe');
            }
            sessionManager.create(utils.getDataFromRes(response));
            utils.redirectionHandle();
          } else if (utils.isResLocked(response)) {
            helper.openEmailVerificationRequiredPopup(_this, 'SIGN_IN_EMAIL_VERIFICATION_REQUIRED', data.email);
            document.getElementById("pwd").blur();
            _this.resetForm();
          } else {
            utils.flashMsg('show', utils.getServerErrorMsg(response));
          }
        }
      });
    }
  }

  resetForm() {
    this.setState({
      email: '',
      password: '',
      rememeberMe : false
    });
  }

  handleUserInput(e){
    this.setState({[e.target.name]: e.target.value});
  }

  handleInputChange(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    this.setState({
      [e.target.name]: value
    });
  }

  handleInputOnBlur(e){
    this.setState({[e.target.name]: e.target.value});
    this.validateField(e.target.name, e.target.value);
  }

  validateField(fieldName, value) {
    let fieldValidationErrors = this.state.formErrors;
    let userData = this.state.userData;

    switch(fieldName) {
      case 'email':
        if(value){
          this.state.emailValid = value.match(/^(\s*[\w-+\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}\s*|[0-9]{1,3}\s*)(\]?)$/);
          fieldValidationErrors.email = this.state.emailValid ? '' : constant.INVALID_EMAIL_ADD;
        }else{
          this.state.emailValid = false;
          fieldValidationErrors.email = this.state.emailValid ? '' : constant.ENTER_EMAIL;
        }
        break;
      case 'password':
        if(!value){
          this.state.passwordValid = false;
          fieldValidationErrors.password = this.state.passwordValid ? '': constant.ENTER_PASSWORD;
        }else{
          this.state.passwordValid = true;
          fieldValidationErrors.password = '';
        }
        break;
      default:
        break;
    }
    this.setState({formErrors: fieldValidationErrors,
      emailValid: this.state.emailValid,
      passwordValid: this.state.passwordValid,
    }, this.validateForm);
  }

  validateForm() {
    this.setState({formValid: this.state.emailValid && this.state.passwordValid});
  }

  render() {
    let routesPath = constant['ROUTES_PATH'];

    return (
      <div className="le_form-wrapper">
        <h4 className="le-form-title le_f-bold le_text-center le_text-black">Sign In</h4>
        <form className="le_sign-in-form sign-in-form" onSubmit={this._handleClick}>
          <div className={this.state.formErrors.email !== '' ? 'form-group global-error' : 'form-group'}>
            <label className="le_color-lgray font-13 le_f-light" htmlFor="email">Email* </label>
            <input type="text" className="le_form-control le_input-bg email-id" name="email"
              placeholder="Enter your email"
              value={this.state.email}
              onBlur={this.handleInputOnBlur} onChange={this.handleUserInput} />
            <p><span>{this.state.formErrors.email !== '' ? this.state.formErrors.email : ''}</span></p>
          </div>
          <div className={this.state.formErrors.password !== '' ? 'form-group global-error' : 'form-group'}>
            <label className="le_color-lgray font-13 le_f-light" htmlFor="pwd">Password*</label>
            <div className="pwd-wrapper le_position-relative">
              <input type="password" id="pwd" className="pswd le_input-bg le_radius le_form-control" name="password" placeholder="Enter your password" value={this.state.password} onBlur={this.handleInputOnBlur} onChange={this.handleUserInput} />
              <span onClick={this.showPassword} className="le_eye-icon eye le_position-absolute le_cursor"><i className={this.state.showPass ? "fa fa-eye" : "fa fa-eye-slash"}></i></span>
            </div>
            <p><span>{this.state.formErrors.password !== '' ? this.state.formErrors.password : ''}</span></p>
          </div>
          <div className="form-group checkbox mb-35 le_flex-vcenter">
            <label className="pmd-checkbox le_check-rememeberMe le_color-lgray font-13 le_f-light">
              <input className="le_input-rememeberMe le_form-control" type="checkbox" name="rememeberMe" checked={this.state.rememeberMe} onChange={this.handleInputChange} /><span className="pmd-checkbox-label">&nbsp;</span><span className="pmd-checkbox-txt">Remember me</span>
            </label>
            <span className="le_forgot-link le_ml-2"> <Link className="font-13 le_f-light" to={routesPath['FORGOT_PASSWORD']}>Forgot Password </Link></span>
          </div>
          <div className="btns">
            <button type="submit" className="le_btn btn le_f-bold sign-in-btn">Sign In</button>
          </div>
          <div className="le_signin-with le_mt-4">
            <div className="le_signin-txt le_position-relative le_text-center font-13 le_color-lgray le_my-3">or continue with</div>
            <div className="le_signin-other le_flex-vcenter le_justify-content-around le_mb-4">
              <div className="signin-opt-row le_cursor">
                <img src={constant['IMG_PATH'] + 'search-signin.png'} alt="" className="search-icon le_img-fluid" />
              </div>
              <div className="signin-opt-row le_cursor">
                <img src={constant['IMG_PATH'] + 'apple-signin.png'} alt="" className="apple-icon le_img-fluid" />
              </div>
              <div className="signin-opt-row le_cursor">
                <img src={constant['IMG_PATH'] + 'linkedin-signin.png'} alt="" className="linkdin-icon le_img-fluid" />
              </div>
            </div>
          </div>
        </form>
        <div className="already-signed">Don’t have an account? <Link to={routesPath['SIGN_UP']}>Sign Up</Link></div>
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </div>
    );
  }
}
