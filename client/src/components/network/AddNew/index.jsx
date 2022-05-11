import { defaultTo } from 'lodash';
import React from 'react';
import Select from 'react-select';
import { constant, utils } from '../../../shared/index';

export default class AddNew extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formErrors: {
        email: '',
        first_name: '',
        last_name: '',
        practice_areas: '',
        state: '',
        bar_number: ''
      },
      formVal: {
        email: '',
        fname: '',
        lname: '',
        practice_areas: [],
        skills: [],
        licensure: [
          {
            bar_state_id: '',
            bar_registration_number: ''
          }
        ]
      },
      currentUser: {},
      myNetwork: []
    }

    this.handleCreateAccount = this.handleCreateAccount.bind(this);
    this.handleInputOnBlur = this.handleInputOnBlur.bind(this);
    this.practiceChange = this.practiceChange.bind(this);
    this.skillsChange = this.skillsChange.bind(this);
    this.validateField = this.validateField.bind(this);
    this.randomString = this.randomString.bind(this);
    this.addStateLicense = this.addStateLicense.bind(this);
    this.deleteStateLicense = this.deleteStateLicense.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.handleEmailInput = this.handleEmailInput.bind(this);
    this.handleFirstNameInput = this.handleFirstNameInput.bind(this);
    this.handleLastNameInput = this.handleLastNameInput.bind(this);
    this.handleState = this.handleState.bind(this);
    this.handleBarNumber = this.handleBarNumber.bind(this);
  }

  componentDidMount() {
    var userData = utils.getCurrentUser();
    this.setState({currentUser: userData});
    this.getMyNetwork();
  }

  getMyNetwork() {
    let _this = this;
    utils.apiCall('GET_MY_NETWORK', {}, function (err, response) {
      if (err) {
      } else {
        let user = response.data.user;
        let myNetwork = user.my_network;
        _this.setState({
          myNetwork: myNetwork
        });
      }
    })
  }

  resetForm() {
    let formVal = {
                    email: '',
                    fname: '',
                    lname: '',
                    practice_areas: [],
                    skills: [],
                    licensure: [
                      {
                        bar_state_id: '',
                        bar_registration_number: ''
                      }
                    ]
                  };
    
    let formErrors = {
      email: '',
      first_name: '',
      last_name: '',
      practice_areas: '',
      state: '',
      bar_number: ''
    };

    this.setState({
      formVal: formVal,
      formErrors: formErrors
    });
  }

  randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  handleCreateAccount() {
    const _this = this;
    const {formVal, formErrors, currentUser} = this.state;
    let fieldValidationErrors = formErrors;
    let isError = false;
    let isEmailInNetwork = false;

    switch('email') {
      case 'email':
        if (formVal.email) {
          let isEmailValid = formVal.email.match(/^(\s*[\w-+\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}\s*|[0-9]{1,3}\s*)(\]?)$/);
          fieldValidationErrors.email = isEmailValid ? '' : constant.INVALID_EMAIL_ADD;
          isError = isEmailValid ? false : true;
        } else {
          fieldValidationErrors.email = constant.ENTER_EMAIL_ATTORNEY;
          isError = true;
        }
      
      case 'fname':
        if (formVal.fname) {
          fieldValidationErrors.first_name = '';
          fieldValidationErrors.first_name = formVal.fname.match(
            /^[a-zA-Z \-]+$/
          )
            ? ''
            : constant.INVALID_FIRSTNAME;
          isError = fieldValidationErrors.first_name == '' ? false : true
        } else {
          fieldValidationErrors.first_name = constant.ENTER_FIRST_NAME_ATTORNEY;
          isError = true;
        }

      case 'lname':
        if (formVal.lname) {
          fieldValidationErrors.last_name = '';
          fieldValidationErrors.last_name = formVal.lname.match(
            /^[a-zA-Z \-]+$/
          )
            ? ''
            : constant.INVALID_FIRSTNAME;
          isError = fieldValidationErrors.last_name == '' ? false : true
        } else {
          fieldValidationErrors.last_name = constant.ENTER_LAST_NAME_ATTORNEY;
          isError = true;
        }
        break;
        
      default:
        break;
    }

    this.setState({ formErrors: fieldValidationErrors });

    const password = this.randomString(12, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

    let myNetwork = this.state.myNetwork;

    myNetwork.map(m => {
      if(m == formVal.email.toLowerCase().trim()) {
        isEmailInNetwork = true;
      }
    });

    if(!isEmailInNetwork) {
      myNetwork.push(formVal.email.toLowerCase().trim());
      const data = {
        first_name: formVal.fname.charAt(0).toUpperCase() + formVal.fname.slice(1),
        last_name: formVal.lname.charAt(0).toUpperCase() + formVal.lname.slice(1),
        email: formVal.email.toLowerCase().trim(),
        password: password,
        job_seeker_info: { basic_profile: { 
          bar_admission: formVal.licensure,
          practice_area_id: formVal.practice_areas,
          skill_used_id: formVal.skills
        }},
        confirm_password: password,
        network_email: currentUser.email,
        network_name: currentUser.first_name + ' ' + currentUser.last_name,
        my_network: myNetwork
      }

      if(!isError) {
        utils.apiCall('SIGN_UP_ATTORNEY', { 'data': data }, function(err, response) {
          if (err) {
            utils.flashMsg('show', 'Error in Sign Up');
            utils.logger('error', 'Sign Up Error -->', err);
          } else {
            if (utils.isResSuccess(response)) {
              // let attorney = response.data.attorney;
              utils.flashMsg('show', 'Attorney is successfully added.');
              _this.props.getUserList();
              _this.resetForm();
            } else if (response['data']['code'] === constant['HTTP_STATUS_CODES']['IM_USED']) {
              utils.flashMsg('show', 'Attorney is successfully added.');
              _this.props.getUserList();
              _this.resetForm();
            } else {
              utils.flashMsg('show', utils.getServerErrorMsg(response));
            }
          }
        });
      }
    }else{
      utils.flashMsg('show', 'Please fill in all required fields - Email, First Name and Last Name.');
      _this.resetForm();
    }
  }
  
  validateField(fieldName, value, index) {
    const { formVal, formErrors } = this.state;
    let fieldValidationErrors = formErrors;

    switch(fieldName) {
      case 'email':
        if (value) {
          let isEmailValid = value.match(/^(\s*[\w-+\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}\s*|[0-9]{1,3}\s*)(\]?)$/);
          fieldValidationErrors.email = isEmailValid ? '' : constant.INVALID_EMAIL_ADD;
        } else {
          fieldValidationErrors.email = constant.ENTER_EMAIL_ATTORNEY;
        }
        break;
      
      case 'fname':
        if (value) {
          fieldValidationErrors.first_name = '';
          fieldValidationErrors.first_name = value.match(
            /^[a-zA-Z \-]+$/
          )
            ? ''
            : constant.INVALID_FIRSTNAME;
        } else {
          fieldValidationErrors.first_name = constant.ENTER_FIRST_NAME_ATTORNEY;
        }
        break;

      case 'lname':
        if (value) {
          fieldValidationErrors.last_name = '';
          fieldValidationErrors.last_name = value.match(
            /^[a-zA-Z \-]+$/
          )
            ? ''
            : constant.INVALID_FIRSTNAME;
        } else {
          fieldValidationErrors.last_name = constant.ENTER_LAST_NAME_ATTORNEY ;
        }
        break;
        
      default:
        break;
    }

    this.setState({ formErrors: fieldValidationErrors });
  }

  handleInputOnBlur(e, index) {
    let formVal = Object.assign({}, this.state.formVal);
    formVal[e.target.name] = e.target.value;
    this.setState({ formVal });
    this.validateField(e.target.name, e.target.value, index);
  }

  practiceChange(val) {
    let list = [];
    for (var key in val) {
      list.push(val[key].value);
    }
    var fieldValidationErrors = Object.assign({}, this.state.formErrors);
    var formVal = Object.assign({}, this.state.formVal);
    formVal.practice_areas = list;
    if (formVal.practice_areas.length <= 0) {
      fieldValidationErrors.practice_areas = constant.ENTER_PRACTICE_AREA;
    } else {
      fieldValidationErrors.practice_areas = '';
    }
    this.setState({ formErrors: fieldValidationErrors });
    this.setState({ formVal });
  }

  skillsChange(val, type) {
    let list = [];
    var flag = false;
    var formVal = Object.assign({}, this.state.formVal);

    for (var key in val) {
      list.push(val[key].value);
      if (type == 'skills') {
        if (val[key].label == 'Other') {
          flag = true;
        }
      }
    }

    if (!val.length) {
      formVal['showOthers'] = false;
      formVal['others'] = '';
    }

    if (flag) {
      formVal['showOthers'] = true;
    } else {
      formVal['showOthers'] = false;
      formVal['others'] = '';
    }

    formVal[type] = list;
    this.setState({ formVal });
  }

  addStateLicense() {
    let formValue = this.state.formVal;
    formValue.licensure.push({
      state: '',
      barNumber: ''
    });
    this.setState({formValue});
  }

  deleteStateLicense(index, e) {
    var formVal = this.state.formVal;
    formVal.licensure.splice(index, 1);
    this.setState({ formVal });
  }

  handleEmailInput(e) {
    let formVal = this.state.formVal;
    formVal.email = e.target.value;
    this.setState({formVal});
  }

  handleFirstNameInput(e) {
    let formVal = this.state.formVal;
    formVal.fname = e.target.value;
    this.setState({formVal});
  }

  handleLastNameInput(e) {
    let formVal = this.state.formVal;
    formVal.lname = e.target.value;
    this.setState({formVal});
  }

  handleState(i, e) {
    let formVal = Object.assign({}, this.state.formVal);
    formVal.licensure[i][e.target.name] = e.target.value;
    this.setState({ formVal });
  }

  handleBarNumber(i, e) {
    let formVal = Object.assign({}, this.state.formVal);
    formVal.licensure[i][e.target.name] = e.target.value;
    this.setState({ formVal });
  }

  render() {
    const {state_dropdown, practice_areas_dropdown, skills_dropdown, formVal} = this.state;

    return (
      <div className="col-lg-6 col-md-6 col-sm-12 addnew-container">
        <div className="d-flex justify-start">
          <div className="title fs-18 m-l-1">
            Add Attorney To My Network
          </div>
        </div>
        <div className="addnew-content">
          <div>
            <button
              name="filter"
              className={"d-block btn-primary btn m-l-1"}
              onClick={this.handleCreateAccount}
            >
              {' '}
              Create Account & Send Email{' '}
            </button>
          </div>
          <div className="title fs-16 m-t-1">
            Account Information
          </div>
          <hr></hr>
          <div className="account-info">
            <div
              className={this.state.formErrors.email !== '' ? 'form-group global-error' : 'form-group'}
            >
              <label htmlFor="email" className="control-label">
                Email*
              </label>
              <input
                onChange={this.handleEmailInput}
                onBlur={this.handleInputOnBlur}
                type="email"
                name="email"
                id="email"
                value={formVal.email}
                className="form-control"
                placeholder="owholmes@gmail.com"
              />
              <p>
                <span>
                  {this.state.formErrors.email !== '' ? this.state.formErrors.email : ''}
                </span>
              </p>
            </div>
            <div
              className={this.state.formErrors.first_name !== '' ? 'form-group global-error' : 'form-group'}
            >
              <label htmlFor="fname" className="control-label">
                First Name*
              </label>
              <input
                onChange={this.handleFirstNameInput}
                onBlur={this.handleInputOnBlur}
                type="text"
                name="fname"
                id="fname"
                value={formVal.fname}
                className="form-control"
                placeholder="Oilver"
              />
              <p>
                <span>
                  {this.state.formErrors.first_name !== '' ? this.state.formErrors.first_name : ''}
                </span>
              </p>
            </div>
            <div
              className={this.state.formErrors.last_name !== '' ? 'form-group global-error' : 'form-group'}
            >
              <label htmlFor="lname" className="control-label">
                Last Name*
              </label>
              <input
                onChange={this.handleLastNameInput}
                onBlur={this.handleInputOnBlur}
                type="text"
                name="lname"
                id="lname"
                value={formVal.lname}
                className="form-control"
                placeholder="Holmes"
              />
              <p>
                <span>
                {this.state.formErrors.last_name !== '' ? this.state.formErrors.last_name : ''}
                </span>
              </p>
            </div>
          </div>
          <div className="title fs-16">
            Skill Information
          </div>
          <hr></hr>
          <div className="skill-info">
            <div
              className={'form-group'}
            >
              <label htmlFor="" className="control-label">
                Practice Areas
              </label>
              <Select
                multi
                closeOnSelect={false}
                onBlurResetsInput={true}
                autosize={false}
                onNewOptionClick={value => this.practiceChange(value, index)}
                onChange={value => this.practiceChange(value)}
                options={this.props.dropdown.practice_areas_dropdown}
                placeholder="Select Practice Area(s)"
                value={this.state.formVal.practice_areas}
              />
            </div>
            <div
              className={'form-group'}
            >
              <label htmlFor="" className="control-label">
                Skills
              </label>
              <Select
                multi
                closeOnSelect={false}
                onBlurResetsInput={true}
                autosize={false}
                onNewOptionClick={value => this.skillsChange(value)}
                onChange={value =>
                  this.skillsChange(value, 'skills')
                }
                options={this.props.dropdown.skills_dropdown}
                value={this.state.formVal.skills}
                placeholder="Select Skill(s)"
              />
            </div>
          </div>
          <div className="title fs-16">
            State Licensure Information
          </div>
          <hr></hr>
          {
            formVal.licensure.map((l, ind) => {
              return <div className="state-license" key={ind}> 
                      <div className="d-flex justify-content-between">
                        <div
                          className={'form-group m-r-1 state-input' }
                        >
                          <label htmlFor="" className="control-label">
                            State
                          </label>
                          <div className="select-wrapper">
                            <select
                              onBlur={this.handleInputOnBlur}
                              className="select-simple"
                              name="bar_state_id"
                              onChange={e => this.handleState(ind, e)}
                              className="form-control pmd-select2"
                              value={l.bar_state_id}
                            >
                              <option value="">Select state</option>
                              {this.props.dropdown.state_dropdown}
                            </select>
                          </div>
                        </div>
                        <div className={'form-group bar-number-input'}>
                          <label htmlFor="" className="control-label">
                            Bar Registration Number
                          </label>
                          <input
                            onChange={e => this.handleBarNumber(ind, e)}
                            onBlur={this.handleInputOnBlur}
                            type="text"
                            name="bar_registration_number"
                            id="barNumber"
                            className="form-control"
                            value={l.bar_registration_number}
                          />
                        </div>
                      </div>
                      <div className="row add-more-wrapper m-0">
                        <a
                          className={
                            ind == this.state.formVal.licensure.length - 1
                              ? 'add-more'
                              : 'add-more d-none'
                          }
                          onClick={this.addStateLicense}
                        >
                          <img
                            src={constant['IMG_PATH'] + 'add-more-icon.png'}
                            alt="add more"
                          />
                          Add More
                        </a>
                        <a
                          className={
                            ind !== 0 ? 'delete-more' : 'delete-more d-none'
                          }
                          onClick={e => this.deleteStateLicense(ind, e)}
                        >
                          <img
                            src={constant['IMG_PATH'] + 'delete-more.png'}
                            alt="delete more"
                          />{' '}
                          Delete
                        </a>
                      </div>
                    </div>
            })
          }
        </div>
      </div>
    );
  }
}