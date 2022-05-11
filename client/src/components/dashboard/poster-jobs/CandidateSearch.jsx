import React from 'react';
import { Link } from 'react-router';
import { ToastContainer } from 'react-toastify';
import Pagination from '../shared/Pagination';
// import { Truncate } from 'react-read-more';
import ReadMoreReact from 'read-more-react';
import Select from 'react-select';
import _ from 'lodash';

import { Dashboard, NoRecordFound } from '../../index';
import { constant, utils, helper } from '../../../shared/index';
import config from '../../../shared/config';
import ModalPopup from '../../shared/modal-popup/ModalPopup';

export default class CandidateSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      totalCandidateCount: 0,
      candidateData: [],
      filteredCandidateData: [],
      isResponse: false,
      practice_area_dropdown: [],
      state_dropdown: [],
      practiceAreas: [],
      states: [],
      activePage: 1,
      itemsCountPerPage: 10,
      modalPopupObj: {},
      jobId: props.params.jobId,
      jobDetails: {},
      freezeActivity: false,
      isBarIdValid: 'Yes',
      isInviteCandidate: true
    };

    this.handlePageChange = this.handlePageChange.bind(this);
    this.setMultiSelectValues = this.setMultiSelectValues.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleCandidateInvite = this.handleCandidateInvite.bind(this);
    this.getJobDetails = this.getJobDetails.bind(this);
  }

  componentDidMount() {
    let that = this;
    const practiceAreaList = utils.getListData('practice_areas');
    const statesList = utils.getListData('states');
    const practiceAreas = [];
    const states = [];
    // get subscribed plan
    utils.apiCall('SUBSCRIBED_PLAN', {}, function (err, response) {
      if (err) {
      } else {        
        let subscribedPlan = response.data.plan;
        if(subscribedPlan == null){
          utils.changeUrl("/subscriptions");
        }else if(!subscribedPlan.is_search_candidate){
          utils.changeUrl("/subscriptions");
        }else if(subscribedPlan.invite_candidate_cnt == 0){
          that.setState({
            isInviteCandidate: false
          });
        }else {
          
        }
      }
    })

    for (let pAreasObj of practiceAreaList) {
      practiceAreas.push({ value: pAreasObj['_id'], label: pAreasObj['name'] });
    }

    for (let statesObj of statesList) {
      states.push({ value: statesObj['_id'], label: statesObj['name'] });
    }

    that.setState({
      practice_area_dropdown: practiceAreas,
      state_dropdown: states
    });
    utils.apiCall('GET_CANDIDATES_DATA', {}, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Candidates data');
        utils.logger('error', 'Get Candidate Data Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          const pageData = response.data.data.slice(
            0,
            that.state.itemsCountPerPage
          );

          that.setState({
            candidateData: response.data.data,
            filteredCandidateData: response.data.data,
            totalCandidateCount: response.data.data.length,
            pageData: pageData
          },()=>{
            if(that.state.jobId){
              that.getJobDetails();
            }
          });
        }
      }
    });

    
    $(document).ready(function() {
      $('#candidateSearchModel').modal('show');
    });
  }

  getJobDetails() {
    let that = this;
    let userRole = constant['ROLE']['POSTER'];
    //userRole = constant['ROLE']['SEEKER'];
    utils.apiCall('GET_JOB_DETAIL', { 'params': [that.state.jobId, userRole] }, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Job Detail');
        utils.logger('error', 'Get Job Detail Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          let freezeActivity = utils.getDataFromRes(response, 'freeze_activity') || false;
          let isBarIdValid = utils.getDataFromRes(response, 'is_bar_id_valid') || 'Yes';
          let responseData = utils.getDataFromRes(response, 'job_detail');
          that.setState({
            jobDetails: responseData,
            freezeActivity: freezeActivity,
            isBarIdValid: isBarIdValid
          },()=>{
            that.handleSearch();
          });
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
      that.setState({
        isResponse: true
      });
    });
  }

  setMultiSelectValues(val, key) {
    var stateObj = this.state;
    stateObj[key] = val;
    this.setState(stateObj);
  }

  handlePageChange(pageNumber) {
    this.setState({
      activePage: pageNumber
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

  getPracticeAreas(pAreasArr) {
    let arr = utils
      .getListDataRelatedToIds('practice_areas', pAreasArr)
      .map(function (item) {
        return item.name;
      });
    let len = arr.length;

    return len > 0 ? (
      <div className="col-sm-4">
        <span className="d-inline-block truncate-80">
          <i className="fa fa-bookmark" aria-hidden="true"></i>
          {arr.slice(0, 2).join(', ')}
        </span>
        {len > 2 ? (
          <span className="d-inline-block v-bottom"> +{len - 2}</span>
        ) : null}
      </div>
    ) : null;
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

  getLocations(statesArr) {
    let arr = utils
      .getListDataRelatedToIds('states', statesArr)
      .map(function (item) {
        return item.name;
      });
    let len = arr.length;

    return len > 0 ? (
      <div className="col-sm-4">
        <span className="d-inline-block truncate-80">
          <i className="fa fa-bookmark" aria-hidden="true"></i>
          {arr.slice(0, 2).join(', ')}
        </span>
        {len > 2 ? (
          <span className="d-inline-block v-bottom"> +{len - 2}</span>
        ) : null}
      </div>
    ) : null;
  }

  handleSearch() {
    const { practiceAreas, states, candidateData } = this.state;
    var selectedArea = _.map(practiceAreas, 'value'),
          selectedStates = _.map(states, 'value');
    if(!_.isEmpty(this.state.jobDetails)){
      var specArea = _.map(this.state.jobDetails.practiceArea,'value'),
            specState = [this.state.jobDetails.state_info._id];
      selectedArea = selectedArea.concat(specArea);
      selectedStates = selectedStates.concat(specState);
    }
    const filteredCandidatesArray = candidateData.filter(candidate => {
      const jobArea = candidate.job_seeker_info.basic_profile.practice_area_id,
        jobState = candidate.job_seeker_info.job_profile.willing_to_work_location_id;

      const practiceAreaMatched =
        selectedArea.length === 0 ||
        _.intersection(jobArea, selectedArea).length > 0;
      const stateMatched =
        selectedStates.length === 0 ||
        _.intersection(jobState, selectedStates).length > 0;

      return practiceAreaMatched && stateMatched;
    });

    const filteredTotalCount = filteredCandidatesArray.length;

    this.setState({
      filteredCandidateData: filteredCandidatesArray,
      totalCandidateCount: filteredTotalCount
    });
  }

  handleCandidateInvite(item) {
    const decreaseInviteCandidateCnt = () => utils.apiCall('DECREASE_INVITE_CNT', {}, function(err, response) {
      if (err) {} else {
        // console.log("DECREASE_INVITE_CNT:", response.data)
      }
    });
    helper.openSendMessagePopup(this, item._id, true, decreaseInviteCandidateCnt);
  }

  render() {
    const {
      filteredCandidateData,
      totalCandidateCount,
      practiceAreas,
      states,
      itemsCountPerPage,
      activePage,
      modalPopupObj,
      isInviteCandidate
    } = this.state;
    const pageData = filteredCandidateData.slice(
      itemsCountPerPage * (Number(activePage) - 1),
      itemsCountPerPage * Number(activePage)
    );
    const totalPageCount = Math.ceil(
      filteredCandidateData.length / itemsCountPerPage
    );
    var routesPath = constant['ROUTES_PATH'];
    return (
      <Dashboard>
        <ToastContainer />
        <section className="job-details-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Job Posting</li>
              {this.state.jobId ? (                
                <p>
                  <Link to={routesPath['MY_POSTED_JOBS']}>
                    My Jobs
                  </Link>
                    <i className="fa fa-angle-right mr-15 ml-15" aria-hidden="true"></i>
                  <Link to={routesPath['MY_POSTED_JOBS']+'/'+this.state.jobId}>
                    Job Detail
                  </Link>
                    <i className="fa fa-angle-right mr-15 ml-15" aria-hidden="true"></i>
                  Candidate Search for "{this.state.jobDetails.jobHeadline}"
                </p>
              ) : (<p>Candidate Search</p>)}
            </ol>
          </div>
          {
            isInviteCandidate ? null :
              // <p style={{color: '#e53935', marginBottom: '10px'}}>*You have to upgrade a subscription plan to invite a candidate. Click <Link to="/subscriptions">here</Link> to upgrade a subscription plan.</p>

              <div className="modal" id="candidateSearchModel" tabindex="-1" role="dialog">
                <div className="modal-dialog post-project-model-background" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                    <div className="modal-body post-project-model-body">

                      <div className="row">

                        <div className="col-md-12">
                          <div className="text-container">
                            <h3>
                              <span>
                                <img src="/images/plan-icon.png" />
                              </span>
                              Upgrade Your Plan</h3>
                            <div className="textDiv">
                              <p>In order to invite a candidate to apply, you must first upgrade your plan by clicking below.</p>
                              <Link to="/subscriptions" className="btn btn-primary">Click here to upgrade your plan </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


          }
          <div className="bg-white clearfix pb-30" style={{display: 'grid'}}>
            <div className="search-filter-box m-30">
              <div className="col-sm-5">
                <div className="form-group">
                  <label className="control-label">Practice Area</label>
                  <Select
                    multi
                    closeOnSelect={false}
                    onBlurResetsInput={true}
                    autosize={false}
                    onChange={val =>
                      this.setMultiSelectValues(val, 'practiceAreas')
                    }
                    options={this.state.practice_area_dropdown}
                    placeholder="Select Practice Area(s)"
                    value={practiceAreas}
                  />
                </div>
              </div>
              <div className="col-sm-5">
                <div className="form-group">
                  <label className="control-label">State</label>
                  <Select
                    multi
                    closeOnSelect={false}
                    onBlurResetsInput={true}
                    autosize={false}
                    onChange={val => this.setMultiSelectValues(val, 'states')}
                    options={this.state.state_dropdown}
                    placeholder="Select State(s)"
                    value={states}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn ml-10 btn-primary mt-30"
                onClick={this.handleSearch}
              >
                Search
              </button>
            </div>
            <div className="status-content">
              <div className="candidates-applied column-flex">
                {pageData.length > 0 ? (
                  pageData.map((item, index) => (
                    <div key={index} className="candidate-data ml-30 mr-30">
                      <div className="pull-left pr-30">
                        <img
                          src={this.getPhotoUrl(
                            item.job_seeker_info.network.photo
                          )}
                          alt="profile-img"
                          onError={this.profileImgError}
                        />
                      </div>
                      <div className="right-panel p-0">
                        <div className="row m-0">
                          <Link
                            to={this.userDetailLink(item._id)}
                            className="job-title mb-10"
                          >
                            {item.first_name + ' ' + item.last_name}
                          </Link>
                        </div>
                        <div className="row sub-titles">
                          {this.getPracticeAreas(
                            item.job_seeker_info.basic_profile.practice_area_id
                          )}
                          {this.getLocations(
                            item.job_seeker_info.job_profile
                              .willing_to_work_location_id
                          )}
                          <span className="clearfix"></span>
                        </div>
                        <div className="para mt-10 mb-20" style={{color: '#666666'}}>
                          <ReadMoreReact 
                            text={item.job_seeker_info.network.about_lawyer}
                            min={80}
                            ideal={300}
                            className="para mt-10 mb-20"
                            max={500}
                            readMoreText="read more"/>
                        </div>
                        <p>
                          {item.availability_type!=4?(
                            <address style={item.availability_type?{color:'#3270b2'}:{color:'grey'}}>
                              <i className="fa fa-info-circle" aria-hidden="true"></i>
                              {Object.entries(constant.AVAILABILITY_TYPE)[item.availability_type][1].label}
                            </address>
                            ):('')}
                        </p>
                        <div className="buttons text-right">
                          <button
                            type="button"
                            className="btn btn-primary mr-10"
                            onClick={() => this.handleCandidateInvite(item)}
                            disabled={!isInviteCandidate}
                          >
                            Invite
                          </button>
                          <Link to={this.userDetailLink(item._id)}>
                            <button
                              type="button"
                              className="btn btn-primary ml-10"
                            >
                              View Profile
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                    <NoRecordFound name="Candidates" />
                  )}
              </div>
            </div>
          </div>
          {totalCandidateCount > 0 ? (
            <div>
              <Pagination
                activePage={activePage}
                totalPageCount={totalPageCount}
                onChange={this.handlePageChange}
              />
              <span className="clearfix"></span>
            </div>
          ) : (
              ''
            )}
        </section>
        <span className="clearfix"></span>
        <ModalPopup modalPopupObj={modalPopupObj} />
      </Dashboard>
    );
  }
}
