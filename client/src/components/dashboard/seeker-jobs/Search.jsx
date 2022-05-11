import React from 'react';
import Pagination from '../shared/Pagination';
import Select from 'react-select';
import _ from 'lodash';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import { Dashboard, Job, NoRecordFound } from '../../index';
import { constant, utils, cookieManager } from '../../../shared/index';
import ModalPopup from '../../shared/modal-popup/ModalPopup';

export default class JobSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jobRecords: [],
      activePage: 1,
      totalJobCount: 0,
      itemsCountPerPage: 10,
      userRelatedData: '',
      isResponse: false,
      modalPopupObj: {},
      freezeActivity: false,
      practice_area_dropdown: [],
      state_dropdown: [],
      practiceAreas: [],
      states: [],
      selectedOrder: -1,
      selectedOrderCate: 'posted_at',
      searchKeywords: '',
      PremiumSeekerPost: 1
    };

    this.getJobListings = this.getJobListings.bind(this);
    this.getAllDropdownsData = this.getAllDropdownsData.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.setMultiSelectValues = this.setMultiSelectValues.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleOrderSelect = this.handleOrderSelect.bind(this);
    this.handleOrderClick = this.handleOrderClick.bind(this);
    this.getUserData = this.getUserData.bind(this);
  }

  getFilterData(filterArr = [], filterId) {
    return filterArr.filter(function(filter) {
      return filter._id == filterId;
    });
  }

  getAllDropdownsData() {
    const that = this;
    const practiceAreas = [];
    const states = [];

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
          for (let statesObj of data['states']) {
            states.push({ value: statesObj['_id'], label: statesObj['name'] });
          }

          that.setState({
            practice_area_dropdown: practiceAreas,
            state_dropdown: states,
            userRelatedData: data
          });
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
    });
  }

  getJobListings() {
    let that = this;

    const {
      practiceAreas,
      states,
      searchKeywords,
      activePage,
      selectedOrder,
      selectedOrderCate,
      state_dropdown
    } = this.state;
    let selectedStates = _.map(states, 'value');

    if (state_dropdown.length && selectedStates.length > 0) {
      //selectedStates.push(state_dropdown[0].value);
    }

    const data = {
      practiceAreas,
      searchKeywords,
      selectedOrder,
      selectedOrderCate,
      states: selectedStates
    };
    utils.apiCall(
      'GET_JOBS',
      {
        params: [activePage],
        data: data
      },
      function(err, response) {
        if (err) {
          utils.flashMsg('show', 'Error while getting Jobs');
          utils.logger('error', 'Get Jobs Error -->', err);
        } else {
          if (response.data.Code == 200 && response.data.Status == true) {
            window.scrollTo(0, 0);
            let responseData = response.data.Data;
            let jobRecords = responseData.data;
            let totalJobCount = responseData.count;
            that.setState({
              jobRecords: jobRecords,
              totalJobCount: totalJobCount,
              freezeActivity: responseData.userData.freeze_activity,
              isBarIdValid: responseData.userData.is_bar_id_valid
            });
          } else {
            utils.logger('warn', utils.getServerErrorMsg(response));
          }
          that.setState({
            isResponse: true
          });
        }
      }
    );
  }

  handlePageChange(pageNumber) {
    utils.changeUrl(
      constant['ROUTES_PATH']['PROJECT_SEARCH'] + '?page=' + pageNumber
    );
    this.loadSearchData();
  }

  loadSearchData() {
    let page = utils.getParameterByName('page');
    if (!page) {
      page = 1;
    }
    this.setState(
      {
        activePage: Number(page)
      },
      function() {
        this.getJobListings();
      }
    );
  }

  setMultiSelectValues(val, key) {
    var stateObj = this.state;
    stateObj[key] = val;
    this.setState(stateObj);
  }

  handleSearch() {
    this.setState(
      {
        activePage: 1
      },
      function() {
        this.getJobListings();
      }
    );
  }

  getUserData() {
    let _this = this;
    // get subscribed plan
    utils.apiCall('GET_USER_DATA', {}, function (err, response) {
      if (err) {
      } else {        
        let user = response.data.user;  
        _this.setState({
          PremiumSeekerPost: user.job_seeker_info.is_premium
        });
      }
    })
  }

  componentDidMount() {
    this.getUserData();
    this.getAllDropdownsData();
    this.loadSearchData();

    $(document).ready(function() {
      $('#jobSearchMod').modal('show');
    });
  }

  handleOrderSelect(eventKey, event) {
    let selectedOrderCate = this.state.selectedOrderCate;
    if (selectedOrderCate != eventKey) {
      this.setState(
        {
          activePage: 1,
          selectedOrderCate: eventKey
        },
        function() {
          this.getJobListings();
        }
      );
    }
  }
  handleOrderClick(event) {
    this.setState(
      {
        activePage: 1,
        selectedOrder: this.state.selectedOrder * -1
      },
      function() {
        this.getJobListings();
      }
    );
  }

  render() {
    const {
      practiceAreas,
      searchKeywords,
      states,
      jobRecords,
      selectedOrder,
      selectedOrderCate,
      activePage,
      itemsCountPerPage,
      totalJobCount,
      PremiumSeekerPost
    } = this.state;
    const totalPageCount = Math.ceil(totalJobCount / itemsCountPerPage);
    const jobRecordsLength = jobRecords.length;
    const jobs = jobRecords.map(
      function(job) {
        job.fromRoute = 'SEARCH_JOBS';
        job.step = job.job_step;
        job.nTermStatus =
          job.n_terms_status && job.n_terms_status.length
            ? job.n_terms_status[0]
            : 0;
        job.declinedBy = job.declined_by || '';
        job.modalPopupObj = this;
        let stateList = this.state.state_dropdown;
        var state_name = _.result(
          _.find(stateList, function(obj) {
            return obj.value === job.state;
          }),
          'label'
        );
        job.state_name = state_name;
        return (
          <Job
            key={job._id}
            job={job}
            userRelatedData={this.state.userRelatedData}
            freezeActivity={this.state.freezeActivity}
            isBarIdValid={this.state.isBarIdValid}
            PremiumSeekerPost={PremiumSeekerPost}
          />
        );
      }.bind(this)
    );

    // console.log("PremiumSeekerPost: ", PremiumSeekerPost)

    return (
      <Dashboard>
        <section className="job-search-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Job Searching</li>
              <p>Job Search</p>
            </ol>
          </div>
          {
            PremiumSeekerPost == 0 ? 
            // // <div>
            // <p style={{color: '#e53935', marginBottom: '10px'}}>*You have to upgrade a subscription plan to apply for a job. Click <Link to="/subscriptions_seeker">here</Link> to upgrade a subscription plan.</p>
            // // </div> 

            <div className="modal" id="jobSearchMod" tabindex="-1" role="dialog">
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
                                Upgrade to Premium
                                </h3>
                          <div className="textDiv">
                            <p>In order to apply to another project you need to upgrade to our premium subscriber plan by clicking below..</p>
                            <Link to="/subscriptions_seeker" className="btn btn-primary">Click here to upgrade your plan </Link>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            : null 
          }
          <div className="job-search-card mb-30 column-flex">
            <div className="card-head hide"></div>
            <div className="search-filter-box m-30">
              <div className="date-filter-box">
                <div
                  style={{
                    float: 'right',
                    margin: '20px 5px',
                    fontSize: '38px'
                  }}
                  onClick={this.handleOrderClick}
                >
                  {selectedOrder === -1 ? (
                    <i
                      className="icon-button ion-ios-arrow-dropdown-circle "
                      style={{ fontSize: '38px' }}
                    />
                  ) : (
                    <i
                      className="icon-button ion-ios-arrow-dropup-circle "
                      style={{ fontSize: '38px' }}
                    />
                  )}
                </div>

                <Dropdown
                  onSelect={this.handleOrderSelect}
                  className="dropdown-container"
                  id={`dropdown-basic-primary`}
                >
                  <Dropdown.Toggle className="dropdown-order-toggle">
                    {selectedOrderCate === 'posted_at'
                      ? 'Posted Date'
                      : selectedOrderCate === 'total'
                      ? ' Price '
                      : ' State '}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <MenuItem eventKey="posted_at">Posted Date</MenuItem>
                    <MenuItem eventKey="total"> Price </MenuItem>
                    <MenuItem eventKey="state_info.name"> State </MenuItem>
                  </Dropdown.Menu>
                </Dropdown>
                <div
                  style={{
                    float: 'right',
                    margin: '28px 8px'
                  }}
                >
                  <label className="control-label">Sort By</label>
                </div>
              </div>
              <div>
                <div className="col-sm-4">
                  <div className="form-group">
                    <label className="control-label">Practice Area</label>
                    <Select
                      multi
                      closeOnSelect={false}
                      onBlurResetsInput={true}
                      autosize={true}
                      onChange={val =>
                        this.setMultiSelectValues(val, 'practiceAreas')
                      }
                      options={this.state.practice_area_dropdown}
                      placeholder="Select Practice Area(s)"
                      value={practiceAreas}
                    />
                  </div>
                </div>
                <div className="col-sm-3">
                  <div className="form-group">
                    <label className="control-label">State</label>
                    <Select
                      multi
                      closeOnSelect={false}
                      onBlurResetsInput={true}
                      autosize={true}
                      onChange={val => this.setMultiSelectValues(val, 'states')}
                      options={this.state.state_dropdown}
                      placeholder="Select State(s)"
                      value={states}
                    />
                  </div>
                </div>
                <div className="col-sm-3">
                  <div className="form-group">
                    <label className="control-label">Keyword Search</label>
                    <input
                      type="text"
                      className="form-control text-left"
                      placeholder="Input keywords..."
                      style={{ height: '46px' }}
                      defaultValue={searchKeywords}
                      value={searchKeywords}
                      onChange={ev => {
                        this.setState({ searchKeywords: ev.target.value });
                      }}
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
            </div>
            {this.state.isResponse ? (
              jobRecordsLength > 0 ? (
                <div>{jobs}</div>
              ) : (
                <NoRecordFound name="Jobs" />
              )
            ) : null}
          </div>
          {this.state.totalJobCount > 0 ? (
            <div>
              <Pagination
                activePage={this.state.activePage}
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
        <ModalPopup modalPopupObj={this.state.modalPopupObj} />
      </Dashboard>
    );
  }
}
