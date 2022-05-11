import React from 'react';
import { Link } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';
import Pagination from 'react-js-pagination';
import Select from 'react-select';
import { Dashboard, Ref, NoRecordFound } from '../../index';
import { constant, utils, cookieManager } from '../../../shared/index';

export default class SearchRefs extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      activePage: 1,
      refRecords: [],
      userRelatedData: '',
      totalRefCount: 0,
      itemsCountPerPage: 10,
      isResponse: false,
      practice_area_dropdown: [],
      state_dropdown: [],
      practiceAreas: [],
      states: [],
      selectedOrder: -1,
      selectedOrderCate: 'posted_at',
      searchKeywords: '',
      PremiumSeekerReferral: 1
    };
    this.getPostedRefs = this.getPostedRefs.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.getAllDropdownsData = this.getAllDropdownsData.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.getUserData = this.getUserData.bind(this);
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
        this.getPostedRefs();
      }
    );
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

  getPostedRefs() {
    let that = this;
    const {
      practiceAreas,
      states,
      searchKeywords,
      activePage,
      state_dropdown
    } = this.state;
    let selectedStates = _.map(states, 'value');

    let data = {
      type:'search',
      practiceAreas,
      searchKeywords,
      states: selectedStates
    };
    utils.apiCall('GET_POSTED_REFS', {data:data}, function(err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Posted Jobs');
        utils.logger('error', 'Get Posted Jobs Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          window.scrollTo(0, 0);
          let responseData = utils.getDataFromRes(response);
          let refRecords = responseData.refs;
          // console.log("AAAAAAAA",refRecords);
          that.setState({
            refRecords: refRecords,
            totalRefCount: refRecords.length,
          });
        } else {
          utils.logger('warn', utils.getServerErrorMsg(response));
        }
        that.setState({
          isResponse: true
        });
      }
    })
  }

  getUserData() {
    let _this = this;
    // get subscribed plan
    utils.apiCall('GET_USER_DATA', {}, function (err, response) {
      if (err) {
      } else {        
        let user = response.data.user;  
        _this.setState({
          PremiumSeekerReferral: user.job_seeker_info.is_referral
        });
      }
    })
  }

  componentDidMount() {
    this.getUserData();
    this.getPostedRefs();
    this.getAllDropdownsData();
    $(document).ready(function() {
      $('#searchRefMod').modal('show');
    });
  }

  handlePageChange(pageNumber) {
    // console.log(`active page is ${pageNumber}`);
    this.setState({activePage: pageNumber});
  }

  render() {
    var refRecordsLength = this.state.refRecords.length;

    const {
      practiceAreas,
      searchKeywords,
      states,
      PremiumSeekerReferral
    } = this.state;

    var pageRefs = this.state.refRecords.slice((this.state.activePage-1)*this.state.itemsCountPerPage,this.state.activePage * this.state.itemsCountPerPage);
    var refs = pageRefs.map(function(ref){
      return (
        <Ref key={ref._id} referral={ref} type='SearchRef' PremiumSeekerReferral={PremiumSeekerReferral} />
      )
    });

    return (
      <Dashboard>
        <ToastContainer />
        <section className="job-details-wrapper">
        <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Referral Searching</li>
              <p>Referral Search</p>
            </ol>
          </div>
          {
            PremiumSeekerReferral == 0 ?
              // <div>
              // <p style={{color: '#e53935', marginBottom: '10px'}}>*You have to upgrade a subscription plan to apply for a referral. Click <Link to="/subscriptions_seeker">here</Link> to upgrade a subscription plan.</p>
              // </div> 
              <div className="modal" id="searchRefMod" tabindex="-1" role="dialog">
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
                                Upgrade to Premium</h3>
                            <div className="textDiv">
                              <p>In order to respond to another referral, you need to upgrade to our premium subscriber plan by clicking below</p>
                              <Link to="/subscriptions" className="btn btn-primary">Click here to upgrade your plan </Link>
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
          <div className="job-search-card mb-30">
            <div className="card-head hide"></div>


            <div className="search-filter-box pt-30 ">
              <div className="mb-30" >
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
            
            { this.state.isResponse ? (refRecordsLength > 0 ? <div>{refs}</div> : <NoRecordFound />) : null }
          </div>
          { this.state.totalRefCount > 0 ?
            <div>
              <Pagination
                firstPageText={<i className='glyphicon glyphicon-chevron-left'/>}
                lastPageText={<i className='glyphicon glyphicon-chevron-right'/>}
                prevPageText={<i className='glyphicon glyphicon-menu-left'/>}
                nextPageText={<i className='glyphicon glyphicon-menu-right'/>}
                activePage={this.state.activePage}
                itemsCountPerPage={this.state.itemsCountPerPage}
                totalItemsCount={this.state.totalRefCount}
                pageRangeDisplayed={5}
                onChange={this.handlePageChange}
              />
              <span className="clearfix"></span>
            </div>
            : ''
          }
        </section>
        <span className="clearfix"></span>
      </Dashboard>
    );
  }
}
