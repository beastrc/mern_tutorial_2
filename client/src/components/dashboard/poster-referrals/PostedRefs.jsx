import React from 'react';
import { Link } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';
import Pagination from 'react-js-pagination';

import { Dashboard, Ref, NoRecordFound } from '../../index';
import { constant, utils, cookieManager } from '../../../shared/index';

export default class PostedRefs extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      activePage: 1,
      refRecords: [],
      userRelatedData: '',
      totalRefCount: 0,
      itemsCountPerPage: 10,
      isResponse: false,
    };
    this.getPostedRefs = this.getPostedRefs.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }


  getPostedRefs() {
    let that = this;
    utils.apiCall('GET_POSTED_REFS',{data:{type:'posted'}}, function(err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Posted Jobs');
        utils.logger('error', 'Get Posted Jobs Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          window.scrollTo(0, 0);
          let responseData = utils.getDataFromRes(response);
          let refRecords = responseData.refs;
          refRecords.map((ref)=>{
            ref.responded_users.map((user, index)=>{
              user.ref_status = ref.ref_status[index].status;
              user.responded_user = ref.ref_status[index].user_id;
              user.ref_id = ref.ref_status[index].job_id;
              user.ref_status_id = ref.ref_status[index]._id;
            });
          });
          // console.log("All REF",refRecords);
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

  componentDidMount() {
    this.getPostedRefs();
  }


  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
  }

  render() {
    var refRecordsLength = this.state.refRecords.length;
    var pageRefs = this.state.refRecords.slice((this.state.activePage-1)*this.state.itemsCountPerPage,this.state.activePage * this.state.itemsCountPerPage);
    var refs = pageRefs.map(function(ref){
      return (
        <Ref key={ref._id} referral={ref} type='PostedRef'/>
      )
    });

    return (
      <Dashboard>
        <ToastContainer />
        <section className="job-details-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Posted Referrals</li>
              <p>My Posted Referrals</p>
            </ol>
          </div>
          <div className="job-search-card mb-30">
            <div className="card-head hide"></div>
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
