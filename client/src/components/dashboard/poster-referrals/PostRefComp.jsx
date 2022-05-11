import React from 'react';
import Select from 'react-select';
import Datetime from 'react-datetime';
import moment from 'moment';
import SimpleReactValidator from 'simple-react-validator';

import { constant, helper, utils } from '../../../shared/index';
import ModalPopup from '../../shared/modal-popup/ModalPopup';

export default class PostRefComp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ref:{
        title:'',
        state:'',
        practiceArea: [],
        skillsNeeded: [],
        refDescription: '',
      },
      practice_area_dropdown: [],
      skill_dropdown: [],
      state_dropdown: [],
      formError: {},
      modalPopupObj: {},
    };
    this.validator = new SimpleReactValidator({autoForceUpdate: this});
    this.changeInput = this.changeInput.bind(this);
    this.getAllDropdownsData = this.getAllDropdownsData.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  componentDidMount() {
    this.getAllDropdownsData();
  }

  clearForm() {
    this.setState({
      ref: {
        title:'',
        state:'',
        practiceArea: [],
        skillsNeeded: [],
        refDescription: '',
      },
    });
    window.scrollTo(0, 0);
  }

  changeInput(ev, key) {
    var val = ev.target.value;
    var stateObj = this.state.ref;
    stateObj[key] = val;
    this.setState({ ref: stateObj });
  }

  setMultiSelectValues(val, key) {
    var stateObj = this.state.ref;
    stateObj[key] = val;
    this.setState({ ref: stateObj });
  }

  getAllDropdownsData() {
    let that = this;
    let practiceAreas = [];
    let skills = [];
    let states = [];

    utils.apiCall('GET_ALL_LISTS', {}, function(err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Dropdown Data');
        utils.logger('error', 'Get All List Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          let data = utils.getDataFromRes(response);
          for (let pAreasObj of data['practice_areas']) {
            practiceAreas.push({
              value: pAreasObj['_id'],
              label: pAreasObj['name']
            });
          }

          for (let skillsObj of data['skills']) {
            skills.push({ value: skillsObj['_id'], label: skillsObj['name'] });
          }

          for (let statesObj of data['states']) {
            states.push(
              <option key={statesObj['_id']} value={statesObj['_id']}>
                {statesObj['name']}
              </option>
            );
          }

          that.setState({
            practice_area_dropdown: practiceAreas,
            skill_dropdown: skills,
            state_dropdown: states,
          });
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
    });
  }

  postRef(evt) {
    let _this = this;
    let callback = function() {
      let popupType = constant['POPUP_TYPES']['CONFIRM'];
      _this.setState(
        {
          modalPopupObj: {
            type: popupType,
            iconImgUrl:
              constant['IMG_PATH'] + 'svg-images/positive-alert-icon.svg',
            msg:
              constant['POPUP_MSG']['REF_POST_SUCCESS'],
            noBtnAction: function() {
              utils.modalPopup(popupType, 'hide', _this);
              utils.changeUrl(constant['ROUTES_PATH']['MY_POSTED_REFS']);
            },
            yesBtnAction: function() {
              utils.modalPopup(popupType, 'hide', _this);
              _this.clearForm();
            }
          }
        },
        function() {
          utils.modalPopup(popupType, 'show', _this);
        }
      );
    };
    _this.createRef(evt, callback);
  }

  createRef(e, callback) {
    e.preventDefault();
    e.stopPropagation();
    var _this = this;
    var mRef = _this.state.ref;
    // console.log("REF", mRef);
    if (this.validator.allValid()) {
      utils.apiCall('CREATE_REF', { data: mRef }, function(err, response) {
        if (err) {
          utils.flashMsg('show', 'Error while creating Referral');
          utils.logger('error', 'Create Referral Error -->', err);
        } else {
          if (response.data.Code == 200 && response.data.Status == true) {
            callback();
          } else {
            utils.flashMsg('show', response.data.Message);
          }
        }
      });
    } else {
      this.validator.showMessages();
      this.forceUpdate();
    }
  }


  render() {
    var mRef = this.state.ref;
    return (
      <div>
        <div className="job-posting-card card">
          <div className="row">
            <div className="col-md-8">
              <div className="form-group">
                <label className="control-label">Referral Title*</label>
                <input
                  name="title"
                  className="form-control"
                  placeholder="Referral Title"
                  type="text"
                  maxLength="150"
                  value={mRef.title}
                  onChange={e => this.changeInput(e, 'title')}
                  onBlur={() => this.validator.showMessageFor('title')}
                />
                {this.validator.message('title', mRef.title, 'required')}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-5">
              <div className="form-group">
                <label className="control-label">State</label>
                <select
                  name="state"
                  className="form-control"
                  value={mRef.state}
                  onChange={e => this.changeInput(e, 'state')}
                >
                  <option value="">Select state</option>
                  {this.state.state_dropdown}
                </select>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="control-label">PRACTICE AREA(S)*</label>
                <Select
                  multi
                  closeOnSelect={false}
                  onBlurResetsInput={true}
                  autosize={false}
                  onChange={val =>
                    this.setMultiSelectValues(val, 'practiceArea')
                  }
                  onBlur={() => this.validator.showMessageFor('practiceArea')}
                  options={this.state.practice_area_dropdown}
                  placeholder="Select Practice Area(s)"
                  value={mRef.practiceArea}
                />
                {this.validator.message('practiceArea', mRef.practiceArea, 'required')}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label className="control-label">Skills Needed*</label>
                <Select
                  multi
                  closeOnSelect={false}
                  onBlurResetsInput={true}
                  autosize={false}
                  onChange={val => this.setMultiSelectValues(val, 'skillsNeeded')}
                  onBlur={() => this.validator.showMessageFor('skillsNeeded')}
                  options={this.state.skill_dropdown}
                  placeholder="Select Skill(s) Needed"
                  value={mRef.skillsNeeded}
                />
                {this.validator.message('skillsNeeded', mRef.skillsNeeded, 'required')}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="control-label">REFERRAL DESCRIPTION*</label>
            <textarea
              name="Description"
              className="form-control"
              maxLength="2000"
              placeholder="Type your description here"
              value={mRef.refDescription}
              onChange={e => this.changeInput(e, 'refDescription')}
              onBlur={() => this.validator.showMessageFor('Description')}
            ></textarea>
            {this.validator.message('Description', mRef.refDescription, 'required')}
          </div>
        </div>

        {this.props.isEditRefPage ? (
          <div className="nxt-prev-btns">
            <button
              name="updateRef"
              className="d-block btn-primary btn pull-right ml-10"
              onClick={e => this.updateRef(e)}
            >
              Update
            </button>
            <span className="clear-fix"></span>
          </div>
        ) : (
          <div className="nxt-prev-btns">
            <button
              name="postJob"
              className="d-block btn-primary btn pull-right ml-10"
              onClick={e => this.postRef(e)}
            >
              Post
            </button>
            <span className="clear-fix"></span>
          </div>
        )}
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </div>
    );
  }
}