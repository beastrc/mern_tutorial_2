import React from 'react';
import { Link } from 'react-router';
import { constant, utils } from '../../shared/index';
import AddNew from './AddNew';
import List from './List';

export default class Network extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      attorneys: [],
      tempAttorneys: [],
      state_dropdown: [],
      state_tmp: [],
      practice_areas_dropdown: [],
      skills_dropdown: [],
      isFileredAttorney: false
    };

    this.backRouter = this.backRouter.bind(this);
    this.getAllDropdownsData = this.getAllDropdownsData.bind(this);
    this.getUserList = this.getUserList.bind(this);
    this.removeItemFromAttorneyList = this.removeItemFromAttorneyList.bind(this);
    this.filterAttorney = this.filterAttorney.bind(this);
  }

  backRouter(e){
    e.preventDefault();
    this.props.router.push(cookieManager.getObject('subscriptionBackUrl'));
  }

  componentDidMount() {
    this.getAllDropdownsData();
    this.getUserList();
  }

  getAllDropdownsData() {
    let that = this;
    let states = [];    
    let practiceAreas = [];
    let skills = [];
    let state_tmp = [];

    utils.apiCall('GET_ALL_LISTS', {}, function(err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting Dropdown Data');
        utils.logger('error', 'Get All List Error -->', err);
      } else {
        if (utils.isResSuccess(response)) {
          let data = utils.getDataFromRes(response);

          for (let statesObj of data['states']) {
            state_tmp.push({
              value: statesObj['_id'],
              label: statesObj['name']
            });
            states.push(
              <option key={statesObj['_id']} value={statesObj['_id']}>
                {statesObj['name']}
              </option>
            );
          }
          that.setState({ state_dropdown: states, state_tmp: state_tmp });

          for (let pAreasObj of data['practice_areas']) {
            practiceAreas.push({
              value: pAreasObj['_id'],
              label: pAreasObj['name']
            });
          }
          that.setState({ practice_areas_dropdown: practiceAreas });

          for (let skillsObj of data['skills']) {
            skills.push({ value: skillsObj['_id'], label: skillsObj['name'] });
          }
          that.setState({ skills_dropdown: skills });
        } else {
          utils.flashMsg('show', utils.getServerErrorMsg(response));
        }
      }
    });
  }

  getUserList() {
    let _this = this;
    var userData = utils.getCurrentUser();

    utils.apiCall('GET_USER_LIST', {}, function (err, response) {
      if (err) {
      } else {
        let users = response.data.users;
        let attorneysTmp = [];
        users.map(u => {
          if(u.email == userData.email) {
            userData = u;
          }
        });
        users.map(u => {
          if(userData.my_network.includes(u.email)) {
            attorneysTmp.push(u)
          }else{
            
          }
        });
        _this.setState({
          attorneys: attorneysTmp,
          tempAttorneys: attorneysTmp
        });
      }
    })
  }

  removeItemFromAttorneyList(index) {
    const { attorneys } = this.state;
    attorneys.splice(index, 1);
    this.setState({attorneys});
    this.setState({ isFileredAttorney: false })
  }

  filterAttorney(params) {
    const { skills, practice_areas, states, availability } = params;
    const { tempAttorneys } = this.state;
    const filteredAttorneys = [];
    tempAttorneys.map(a => {
      const { practice_area_id, bar_admission, skill_used_id } = a.job_seeker_info.basic_profile;
      const states_list = bar_admission.map(b => {
        return b.bar_state_id;
      })
      const availability_type = (availability == '' || availability == 'no') ? true : a.availability_type == availability ? true : false;

      const is_practice = practice_areas.length == 0 ? true : practice_area_id.some(p => practice_areas.includes(p));
      const is_state = states.length == 0 ? true : states_list.some(s => states.includes(s));
      const is_skill = skills.length == 0 ? true : skill_used_id.some(s => skills.includes(s));

      if(availability_type && is_practice && is_state && is_skill) {
        filteredAttorneys.push(a)
      }
    });
    if( (availability == '' || availability == 'no') && practice_areas.length == 0 && states.length == 0 && skills.length == 0) {
      this.setState({attorneys: tempAttorneys, isFileredAttorney: false });
    }else{
      this.setState({attorneys: filteredAttorneys, isFileredAttorney: true });
    }
  }

  render() {
    const dropdown = {
      state_dropdown: this.state.state_dropdown,
      state_tmp: this.state.state_tmp,
      practice_areas_dropdown: this.state.practice_areas_dropdown,
      skills_dropdown: this.state.skills_dropdown
    }

    const {attorneys} = this.state;
    return (
      <div className="my-network-container">
        <div className="section-head" style={{ marginTop: 20 }}>
          <ol className="breadcrumb">
            <li className="breadcrumb-item active">
              <Link to={'/'} onClick={this.backRouter}><i className="fa fa-chevron-left"/> Back To the Previous Page</Link>
            </li>
          </ol>
        </div>
        <div className="my-network-content row">
          <List attorneys={attorneys} isFiltered={this.state.isFileredAttorney} dropdown={dropdown} filter={this.filterAttorney} handleRemove = {this.removeItemFromAttorneyList} />
          <AddNew dropdown={dropdown} getUserList={this.getUserList} />
        </div>
      </div>
    );
  }
}