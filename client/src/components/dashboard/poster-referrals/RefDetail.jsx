import React from 'react';
import { Link } from 'react-router';
import { ToastContainer, toast } from 'react-toastify';
import Pagination from 'react-js-pagination';

import { Dashboard, Ref, NoRecordFound, Candidate } from '../../index';
import { constant, utils, cookieManager } from '../../../shared/index';

export default class RefDetail extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      fromRoute: '',
      ref: {},
      PremiumSeekerReferral: 1
    };
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
  }
  render() {
    var fromRoute = this.props.location.state?this.props.location.state.fromRoute:false;
    var ref = this.props.location.state?this.props.location.state.refData:false;
    const { PremiumSeekerReferral } = this.state;
    
    var candidates='';
    if(fromRoute=="PostedRef"){
      candidates = ref.responded_users.map(function(cand, index){
        return (
          <Candidate key={cand._id} candidate={cand} type={fromRoute} ref_title={ref.title}/>
        )
      });
    }
    return (
      <Dashboard>
        <ToastContainer />
        <section className="job-details-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Referral Detail</li>
              <p>Referral Detail</p>
            </ol>
          </div>
          <div className="job-search-card mb-30">
            <div className="card-head hide"></div>
            {
              ref&&(<Ref key={ref._id} referral={ref} type={fromRoute} detailed={true} PremiumSeekerReferral={PremiumSeekerReferral} />)
            }
          </div>

          <div className="job-search-card mb-30">
            <div className="card-head hide"></div>
            {
              ref.responded_users&&(
                candidates
              )
            }
          </div>

          
        </section>
        <span className="clearfix"></span>
      </Dashboard>
    );
  }
}
