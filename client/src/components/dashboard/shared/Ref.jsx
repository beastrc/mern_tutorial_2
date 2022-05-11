import React from 'react';
import { Link } from 'react-router';
import ReadMoreReact from 'read-more-react';
import { ToastContainer } from 'react-toastify';

import { constant, helper, utils, cookieManager } from '../../../shared/index';
import ModalPopup from '../../shared/modal-popup/ModalPopup';

export default class Ref extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isJobSaved: false,
      modalPopupObj: {},
      refStatus: this.props.referral.ref_status.length>0?this.props.referral.ref_status[0].status:0,
      freezeActivity: props.freezeActivity || false,
      isBarIdValid: props.isBarIdValid || 'Yes',
    };
    this.updateRefStatus = this.updateRefStatus.bind(this);
  }

  onStartChatBtnClick(jobId) {
    let routesPath = constant['ROUTES_PATH'];
    utils.changeUrl(routesPath['CHAT']);
  }

  updateRefStatus(refId, action) {
    let that = this;
    let req = {
      ref_id: refId,
      status: action,
      freeze_activity: that.state.freezeActivity,
      is_bar_id_valid: that.state.isBarIdValid
    };
    utils.apiCall('UPDATE_REF_STATUS', { data: req }, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while performing this action');
        utils.logger('error', 'Update Job Status Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          
          that.setState({
            refStatus: utils.getDataFromRes(response, 'status')['status']
          });
          //utils.flashMsg('show', constant.SUCCESS_RESPOND_REFERRAL, 'success');
          let popupType = constant['POPUP_TYPES']['INFO'];
          that.setState({
            modalPopupObj: {
              type: popupType,
              iconImgUrl: constant['IMG_PATH'] + 'svg-images/ok.svg',
              msg: constant.SUCCESS_RESPOND_REFERRAL,
              yesBtnText: 'Ok',
              yesBtnAction: function () { 
                utils.modalPopup(popupType, 'hide', that) 
              },
            }
          }, function () {
            utils.modalPopup(popupType, 'show', self);
          });

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

  render() {
    let ref = this.props.referral;
    let practiceAreas = ref.practiceArea;
    let skillsNeeded = ref.skillsNeeded;
    
    let practiceAreasLabels = [];
    let skillsNeededLabels = [];
    practiceAreas.filter((pa)=>{
      practiceAreasLabels.push(pa.label);
    });
    skillsNeeded.filter((pa)=>{
      skillsNeededLabels.push(pa.label);
    });
    var jobDetailLinkToObj = {
      pathname: location.pathname + '/' +ref._id ,
      state: {
        fromRoute: this.props.type,
        refData: ref,
      }
    };
    
    // console.log("respondedRef:", this.state.refStatus)
    
    return (
      <div className="card-content">
        <ToastContainer />
        {this.props.detailed?(
          <div className="job-title col-xs-9 col-sm-10">
            {ref.title}
          </div>
        ):(
          <div>
            <Link
              to={jobDetailLinkToObj}
              className="job-title col-xs-9 col-sm-10"
            >
              {ref.title}
            </Link>
            <span className="clearfix"></span>
          </div>
        )}
        {
          (this.props.type=="RespondedRef" || this.props.type=="SearchRef") && (
            <div className="hourly-estimate col-xs-3 col-sm-2 p-0">
              <span style={{ fontSize: '16px', textTransform: 'capitalize' }}>
                {(this.state.refStatus==200) && (
                  'Responded Referral'
                )}
                {(this.state.refStatus==201) && (
                  'Accepted Referral'
                )}
              </span>
            </div>   
          )
        }

        <div className="row sub-titles">
          {skillsNeeded.length > 0 && (
            <div className="col-sm-9">
              <span className="d-inline-block ">
                <i className="fa fa-bookmark" aria-hidden="true"></i>
                {skillsNeededLabels.join(', ')}
              </span>
            </div>
          )}
        </div>
        {
          this.props.detailed && practiceAreas.length > 0 && (
            <div className="row sub-titles">
                <div className="col-sm-9">
                  <span className="d-inline-block ">
                    <i className="fa fa-bookmark" aria-hidden="true"></i>
                    {practiceAreasLabels.join(', ')}
                  </span>
                </div>
            </div>
          )
        }
        
        <div className="m-0">
          {
            this.props.detailed?(
              ref.refDescription
            ):(
              <ReadMoreReact 
              text={ref.refDescription}
              min={80}
              ideal={300}
              max={500}
              readMoreText="read more"/>
            )
          }
          
        </div>
        <div className="card-content-footer row">
          <div className="col-sm-4">
            <div className="pb-5">
              Posted:
              <span>
                {utils
                    .convertUtcToEst(ref.posted_at)
                    .format(constant['JOB_DATE_FORMAT'])}
              </span>
            </div>
            <div className="pb-5">
              State:
              <span>{ref.state_info.name}</span>
            </div>
          </div>
          <div className="col-sm-12 text-right">
            {this.props.type=="PostedRef" && ref.ref_status.length > 0 && (
              <span className="mr-10">
                <img
                  className="mr-10"
                  src={constant['IMG_PATH'] + 'svg-images/user-icon.svg'}
                  alt="user-icon-fill"
                />
                {ref.ref_status.length} Responded
              </span>
            ) }
            {
              (this.props.type=="SearchRef" && this.state.refStatus==0) && (
                <button type="button" className="btn btn-primary mr-10"
                  onClick={this.updateRefStatus.bind(
                    this,
                    ref._id,
                    constant['JOB_STEPS']['REF_RESPOND'],
                  )}
                  disabled={
                    this.props.PremiumSeekerReferral == 0
                  }
                >
                  Respond to this Referral                 
                </button>
              )
            }
                 
            {this.state.refStatus=='201'&&(
            <button type="button" className="btn btn-primary mr-10"
              onClick={this.onStartChatBtnClick.bind(
                this,
                ref._id
              )}
            >
              Send Message
            </button>
            )}

            {!this.props.detailed &&(
                <Link to={jobDetailLinkToObj}>
                  <button type="button" className="btn btn-primary mr-10">
                    View Referral
                  </button>
                </Link>
            )
            } 
          </div>
        </div>
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </div>
    );
  }
}
