import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import ReadMoreReact from 'read-more-react';
import { ToastContainer, toast } from 'react-toastify';

import { constant, helper, utils, cookieManager } from '../../../shared/index';
import config from '../../../shared/config';

export default class Ref extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      refStatus: this.props.candidate?this.props.candidate.ref_status:0,
      freezeActivity: props.freezeActivity || false,
      isBarIdValid: props.isBarIdValid || 'Yes',
    };
  }
  onStartChatBtnClick(jobId) {
    let routesPath = constant['ROUTES_PATH'];
    utils.changeUrl(routesPath['CHAT']);
  }

  updateRefStatus(refId,refSId, action) {
    let candidate = this.props.candidate;
    let ref_title = this.props.ref_title;
    let that = this;
    let req = {
      job_id: refId,
      status_id: refSId,
      status: action,
      freeze_activity: that.state.freezeActivity,
      is_bar_id_valid: that.state.isBarIdValid
    };
    utils.apiCall('UPDATE_JOB_STATUS', { data: req }, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while performing this action');
        utils.logger('error', 'Update Job Status Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          that.setState({
            refStatus: utils.getDataFromRes(response, 'ref_status')
          });
          //create chat room and change ref status
          
          const req1 = {
            job_id: refId,
            job_status: refSId,
            user_seeker: candidate.responded_user,
            room_title: ref_title
          };
          // console.log("AAAAAAAAA", req1, candidate)
          
          utils.apiCall(
            'CREATE_CHAT_ROOM',
            { data: req1 },
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
          
          //////

        } else if (utils.isResConflict(response)) {
          helper.openConflictPopup(that.state.modalPopupObj);
        } else if (utils.isResBarIdValid(response)) {
          helper.openBarIdInvalidPopup(that.state.modalPopupObj);
        } else if (utils.isResLocked(response)) {
          helper.openFreezeActivityPopup(
            that.state.modalPopupObj,
            'ACCOUNT_FROZEN_SEEKER'
          );
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
    });
  }

  getPhotoUrl(imgPath) {
    let photoUrl = constant['IMG_PATH'] + 'default-profile-pic.png';
    if (imgPath) {
      let apiConfig = config.getConfiguration();
      photoUrl = apiConfig.S3_BUCKET_URL + imgPath;
    }
    return photoUrl;
  }
  profileImgError(evt) {
    return utils.onImgError(evt, '/images/default-profile-pic.png');
  }
  userDetailLink(userId) {
    let routesPath = constant['ROUTES_PATH'];
    return {
      pathname: routesPath['PROFILE'] + '/' + userId,
      state: {
        jobId: this.props.jobId,
        isCandidate: true
      }
    };
  }
  render() {
    let candidate = this.props.candidate;
    // let practiceAreas = ref.practiceArea;
    // let skillsNeeded = ref.skillsNeeded;
    
    // let practiceAreasLabels = [];
    // let skillsNeededLabels = [];
    // practiceAreas.filter((pa)=>{
    //   practiceAreasLabels.push(pa.label);
    // });
    // skillsNeeded.filter((pa)=>{
    //   skillsNeededLabels.push(pa.label);
    // });
    // var jobDetailLinkToObj = {
    //   pathname: location.pathname + '/' +ref._id ,
    //   state: {
    //     fromRoute: this.props.type,
    //     refData: ref,
    //   }
    // };
    // console.log('candi',candidate);
    return (
      <div className="card-content">
        <ToastContainer />
        <div className="pull-left pr-30">
          <img
            src={this.getPhotoUrl(
              candidate.job_seeker_info.network.photo
            )}
            alt="profile-img"
            onError={this.profileImgError}
            style={{width: '100px'}}
          />
        </div>
        <div className="right-panel p-0">
          <div className="row m-0">
            <Link
              to={this.userDetailLink(candidate._id)}
              className="job-title mb-10"
            >
              {candidate.first_name + ' ' + candidate.last_name}
            </Link>
          </div>
          <div className="row sub-titles">
            {/* <div className="col-sm-6">
              <span className="d-inline-block truncate-80">
                <i className="fa fa-bookmark" aria-hidden="true"></i>
                {
                  candidate.job_seeker_info.basic_profile.practice_area_id.join(',')
                }
              </span>
              {candidate.job_seeker_info.basic_profile.practice_area_id.length > 2 ? (
                <span className="d-inline-block v-bottom"> +{candidate.job_seeker_info.basic_profile.practice_area_id.length - 2}</span>
              ) : null}
            </div> */}
            {/* {this.getLocations(
              item.job_seeker_info.job_profile
                .willing_to_work_location_id
            )} */}
            <span className="clearfix"></span>
          </div>
        </div>
        
        <div className="card-content-footer row">
          <div className="col-sm-12 text-right">
            
            {this.state.refStatus=='201'&&(
            <button type="button" className="btn btn-primary mr-10"
              onClick={this.onStartChatBtnClick.bind(
                this,
                candidate.ref_id
              )}
            >
              Send Message
            </button>
            )}

            {this.state.refStatus=='200'&&(
                <button type="button" className="btn btn-primary mr-10"
                  onClick={this.updateRefStatus.bind(
                    this,
                    candidate.ref_id,
                    candidate.ref_status_id,
                    constant['JOB_STEPS']['REF_ACCEPTED'],
                  )}
                >
                  Accept
                </button>
              )
            }
            
            <Link
                to={this.userDetailLink(candidate._id)}
              >
              <button type="button" className="btn btn-primary mr-10">
                View Profile
              </button>
            </Link>
            
          </div>

        </div>

      </div>
    );
  }
}
