import React from 'react';

import { Dashboard, PostRefComp } from '../../index';

export default class PostReferral extends React.Component {
  render() {
    return (
      <Dashboard>
        <section className="job-details-wrapper">
          <div className="section-head">
            <ol className="breadcrumb">
              <li className="breadcrumb-item active">Dashboard</li>
              <li className="breadcrumb-item active">Referral Posting</li>
                <p>Post a Referral</p>
            </ol>
          </div>
          <PostRefComp isEditRefPage={false} refId={null}></PostRefComp>
        </section>
        <span className="clearfix"></span>
      </Dashboard>
    );
  }
}
