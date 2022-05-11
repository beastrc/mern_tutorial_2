import React from 'react';
import { utils } from '../../../shared/index';
import { Dashboard, PostJobComp } from '../../index';
import { Link } from 'react-router';

export default class PostAJob extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isEnablePostAJob: true
    };
  }

  componentDidMount() {
    let _this = this;
    // get subscribed plan
    utils.apiCall('SUBSCRIBED_PLAN', {}, function (err, response) {
      if (err) {
      } else {
        let subscribedPlan = response.data.plan;
        if(subscribedPlan.project_post_cnt == 0){
          _this.setState({
            isEnablePostAJob: false
          });
        }
      }
    })

    $(document).ready(function() {
      $('#postajoberror').modal('show');
    });
  }

  render() {
    const { isEnablePostAJob } = this.state;
    return (
      <Dashboard>
        <section className="job-details-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Job Posting</li>
                <p>Post a Job</p>
            </ol>
          </div>
          {
            !isEnablePostAJob ?

              //   <div>
              //   <p style={{color: '#e53935', marginBottom: '10px'}}>*You have to upgrade a subscription plan to post more job. Click <Link to="/subscriptions">here</Link> to upgrade a subscription plan.</p>
              // </div>

              <div className="modal" id="postajoberror" tabindex="-1" role="dialog">
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
                              <p>In order to post another project, you must first upgrade your plan by clicking below.</p>
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
          <PostJobComp isEditJobPage={false} jobId={null} isEnablePostAJob = {isEnablePostAJob}></PostJobComp>
        </section>
        <span className="clearfix"></span>
      </Dashboard>
    );
  }
}
