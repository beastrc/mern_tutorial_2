import React from 'react';
import { constant, utils, config } from '../../../shared/index';
import ModalPopup from '../../shared/modal-popup/ModalPopup';
import { helper } from '../../../shared/index';

export default class AttorneyModel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      practices: [],
      skills: [],
      states: [],
      isDetailShow: false,
      modalPopupObj: {}
    };

    this.handleDetail = this.handleDetail.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleInvite = this.handleInvite.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  componentDidMount() {
    let practicesTmp = [], skilsTmp = [], statesTmp = [], barsTmp = [];

    const { attorney, dropdown } = this.props;
    const job_seeker_info = attorney.job_seeker_info;
    const { practice_area_id, skill_used_id, bar_admission } = job_seeker_info.basic_profile;
    const { state_tmp, practice_areas_dropdown, skills_dropdown } = this.props.dropdown;

    bar_admission.map(b => {
      barsTmp.push(b.bar_state_id);
    });

    practice_areas_dropdown.map(p => {
      if(practice_area_id.includes(p.value)) {
        practicesTmp.push(p.label);
      }
    });

    skills_dropdown.map(s => {
      if(skill_used_id.includes(s.value)) {
        skilsTmp.push(s.label);
      }
    });

    state_tmp.map(s => {
      if(barsTmp.includes(s.value)){
        statesTmp.push(s.label);
      }
    });

    this.setState({
      practices: practicesTmp,
      skills: skilsTmp,
      states: statesTmp
    });
  }

  handleDetail() {
    let _this = this;
    this.setState({
      isDetailShow: !_this.state.isDetailShow
    })
  }

  handleRemove() {
    let _this = this;
    const { attorney } = this.props;
    console.log("email:", attorney.email)
    let popupType = constant['POPUP_TYPES']['CONFIRM'];
    _this.setState({
      modalPopupObj: {
        type: popupType,
        textarea: false,
        noBtnText: 'Cancel',
        yesBtnText: 'Proceed',
        iconImgUrl: constant['IMG_PATH'] + 'svg-images/negative-alert-icon.svg',
        msg: constant['POPUP_MSG']['REMOVE_ATTORNEY'],
        noBtnAction: function () {
          utils.modalPopup(popupType, 'hide', _this);
        },
        yesBtnAction: function (msg) {
          utils.modalPopup(popupType, 'hide', _this);
          utils.apiCall('REMOVE_USER_IN_NETWORK', {data: {remove_email: attorney.email}}, function (err, response) {
            if (err) {
      
            } else {
              if(response.data.success) {
                _this.props.handleRemoveAttorney(_this.props.index);
                utils.flashMsg('show', 'Attorney is successfully removed.');
              }else{
                utils.flashMsg('show', 'Oops! Something went wrong.');
              }
            }
          });
        }
      }
    }, function () {
      utils.modalPopup(popupType, 'show', _this);
    });
  }

  handleInvite() {
    const { attorney } = this.props;
    helper.openSendMessagePopup(this, attorney._id, true);
  }

  handleMessage() {
    const { attorney } = this.props;
    const req = {
      job_status: "network_chat",
      user_seeker: attorney._id,
      room_title: "My Network Room - " + attorney.email
    };
    utils.apiCall(
      'CREATE_CHAT_ROOM',
      { data: req },
      (c_err, c_response) => {
        if (c_err) {
          utils.flashMsg('show', 'Error while creating chat room');
          utils.logger('error', 'Save rating error -->', c_err);
        } else {
          if (utils.isResSuccess(c_response)) {
            utils.flashMsg('show', 'Created new chat room');
          }
        }
      }
    );
  }

  render() {
    const { practices, skills, states, isDetailShow } = this.state;
    const { attorney, dropdown } = this.props;
    const job_seeker_info = attorney.job_seeker_info;
    const { photo } = job_seeker_info.network;
    const photoUrl = photo && photo != '' ? config.getConfiguration()['S3_BUCKET_URL'] + photo : '';
    const userData = utils.getCurrentUser();

    return (
      <React.Fragment>
        <div className={ !isDetailShow ? "attorney-container m-b-2" : "attorney-container"}>
          <div className="rating-container d-flex">
            <div className="rating-star">
              <i className={"ion-ios-star fs-24"} />
            </div>
            <div className="rating-star">
              <i className={"ion-ios-star fs-24"} />
            </div>
            <div className="rating-star">
              <i className={"ion-ios-star-half fs-24"} />
            </div>
            <div className="rating-star">
              <i className={"ion-ios-star-outline fs-24"} />
            </div>
            <div className="rating-star">
              <i className={"ion-ios-star-outline fs-24"} />
            </div>
          </div>
          <div className="d-flex">
            <div className="user-avatar">
              {
                photoUrl != '' ? <img src={photoUrl} alt="user-avatar" /> : <i className={"ion-ios-person"} />
              }
            </div>
            <div className="attorney-info">
              <div className="title fs-16">{attorney.first_name} {attorney.last_name}</div>
              <div className="attorney-experience d-flex">
                <div className="d-flex m-r-2">
                  <div className="m-r-1">
                    <i className="ion-ios-hammer fs-24"></i>
                  </div>
                  <div>
                    {
                      practices.map(p => {
                        return <div key={p}>{p}</div>
                      })
                    }
                  </div>
                </div>
                <div className="d-flex">
                  <div className="m-r-1">
                    <i className="ion-ios-build fs-24"></i>
                  </div>
                  <div className="m-r-2">
                    <div>{skills[0]}</div>
                    <div>{skills[1]}</div>
                    <div>{skills[2]}</div>
                  </div>
                  <div>
                    <div>{skills[3]}</div>
                    <div>{skills[4]}</div>
                    <div>{skills[5]}</div>
                  </div>
                </div>
              </div>
              <div className="license align-center justify-content-start m-t-5p">
                <div>
                  <i className={"ion-ios-finger-print"}></i>
                </div>
                <div className="m-l-1">
                  {states.map(s => {
                    return <span key={s}>{s + ", "}</span>
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between m-t-1">
            <div className="d-flex">
              <button
                name="filter"
                className={"d-block btn-primary btn m-r-1"}
                onClick={this.handleMessage}
                disabled={userData.is_poster_profile_completed ? false : true}
              >
                {' '}
                Message{' '}
              </button>
              <button
                name="filter"
                className={"d-block btn-primary btn m-r-1"}
                onClick={this.handleInvite}
                disabled={userData.is_poster_profile_completed ? false : true}
              >
                {' '}
                Invite{' '}
              </button>
              <button
                name="filter"
                className={"d-block btn-primary btn"}
                onClick={this.handleRemove}
              >
                {' '}
                Remove{' '}
              </button>
            </div>
            {/* <div>
              <button
                name="filter"
                className={"d-block btn-primary btn"}
                onClick={this.handleDetail}
              >
                {' '}
                { !isDetailShow ? 'Detail' : 'Close'}{' '}
              </button>
            </div> */}
          </div>
        </div>
        <div className={ !isDetailShow ? "attorney-detail-none" : "attorney-detail m-b-2"}>
          <div className="m-b-1 fw-bold">HISTORY & ANALYTICS</div>
          <div>
            <div>Projects Worked</div>
            <div>Ratings</div>
            <div>Feedback</div>
            <div>Notes</div>
            <div>Etc.</div>
          </div>
        </div>
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </React.Fragment>
    );
  }
}