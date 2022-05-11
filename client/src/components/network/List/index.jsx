import React from 'react';
import AttorneyModel from '../AttorneyModel';
import Select from 'react-select';
import { constant, utils } from '../../../shared/index';

export default class List extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      practice_areas: [],
      states: [],
      availability: '',
      skills: [],
      keywords: [],
      keyword: '',
      attorneys: []
    };

    this.handlePracticeArea = this.handlePracticeArea.bind(this);
    this.handleStates = this.handleStates.bind(this);
    this.handleAvailability = this.handleAvailability.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleSkills = this.handleSkills.bind(this);
    this.handleRemove = this.handleRemove.bind(this);

    this.input = React.createRef();
  }

  componentDidMount() {
    
  }

  handlePracticeArea(val) {
    let list = [];
    for (var key in val) {
      list.push(val[key].value);
    }
    let { practice_areas } = this.state;
    practice_areas = list;
    this.setState({ practice_areas });
  }

  handleStates(val) {
    let list = [];
    for (var key in val) {
      list.push(val[key].value);
    }
    let { states } = this.state;
    states = list;
    this.setState({ states });
  }

  handleSkills(val) {
    let list = [];
    for (var key in val) {
      list.push(val[key].value);
    }
    let { skills } = this.state;
    skills = list;
    this.setState({ skills });
  }

  handleFilter() {
    const {practice_areas, states, skills, availability} = this.state;
    if(practice_areas == [] && states == [] && skills == [] && availability == '') {
      
    }else{
      this.props.filter(this.state); 
    }
  }

  handleAvailability(e) {
    this.setState({availability: e.target.value});
  }

  handleRemove(id) {
    this.props.handleRemove(id);
  }

  render() {
    const attorney_list = this.props.attorneys.map((a, index) => {
      return <AttorneyModel 
              attorney={a} 
              dropdown={this.props.dropdown} 
              index={index} 
              handleRemoveAttorney={
                this.handleRemove
              } 
              key={a._id} 
            />
    });

    var availabilities = constant['AVAILABILITY_TYPE'];
    var available_list = Object.keys(availabilities).map((key) => [availabilities[key]][0]);

    return (
      <div className="col-lg-6 col-md-6 col-sm-12 list-container">
        <div className="d-flex">
          <div className="title fs-18 m-l-1">
            My Network
          </div>
        </div>
        <div className="list-content">
          <div className="align-center justify-content-between filter-container">
            <div
              className={'select-wrapper'}
            >
              <Select
                multi
                closeOnSelect={false}
                onBlurResetsInput={true}
                autosize={false}
                onNewOptionClick={value => this.handlePracticeArea(value, index)}
                onChange={value => this.handlePracticeArea(value)}
                options={this.props.dropdown.practice_areas_dropdown}
                placeholder="Practice Area(s)"
                value={this.state.practice_areas}
              />
            </div>
            <div
              className={'select-wrapper'}
            >
              <Select
                multi
                closeOnSelect={false}
                onBlurResetsInput={true}
                autosize={false}
                onNewOptionClick={value => this.handleStates(value, index)}
                onChange={value => this.handleStates(value)}
                options={this.props.dropdown.state_tmp}
                placeholder="State(s)"
                value={this.state.states}
              />
            </div>
            <div
              className={'select-wrapper'}
            >
              <Select
                multi
                closeOnSelect={false}
                onBlurResetsInput={true}
                autosize={false}
                onNewOptionClick={value => this.handleSkills(value, index)}
                onChange={value => this.handleSkills(value)}
                options={this.props.dropdown.skills_dropdown}
                placeholder="Skill(s)"
                value={this.state.skills}
              />
            </div>
            <div
              className={'select-wrapper'}
            >
              <select
                className="available-select"
                onChange={ this.handleAvailability }
                name="availability"
              >
                <option value="" hidden>No Availability Type</option>
                <option value="no">No Availability Type</option>
                {
                  available_list.map((a, i) => {
                    return <option key={a.id} value={a.id}>{a.label}</option>
                  })
                }
              </select>
            </div>

            <div>
              <button
                name="filter"
                className={"d-block btn-primary btn pull-right"}
                onClick={this.handleFilter}
              >
                {' '}
                Filter{' '}
              </button>
            </div>
          </div>
          <hr></hr>
          <div className="attorney-list">
            {
              this.props.attorneys.length == 0 && this.props.isFiltered == false ? <div className="attorney-container m-b-2">
                                        <div className="rating-container d-flex">
                                          <div className="rating-star">
                                            <i className={"ion-ios-star fs-24"} />
                                          </div>
                                          <div className="rating-star">
                                            <i className={"ion-ios-star fs-24"} />
                                          </div>
                                          <div className="rating-star">
                                            <i className={"ion-ios-star-half fs-24"} />
                                          </div>
                                          <div className="rating-star">
                                            <i className={"ion-ios-star-outline fs-24"} />
                                          </div>
                                          <div className="rating-star">
                                            <i className={"ion-ios-star-outline fs-24"} />
                                          </div>
                                        </div>
                                        <div className="d-flex">
                                          <div className="user-avatar">
                                            <i className={"ion-ios-person"} />
                                          </div>
                                          <div className="attorney-info">
                                            <div className="title fs-16">Generic Attorney Record</div>
                                            <div className="attorney-experience d-flex">
                                              <div className="d-flex m-r-2">
                                                <div className="m-r-1">
                                                  <i className="ion-ios-hammer fs-24"></i>
                                                </div>
                                                <div>
                                                  <div>Practice Area ________1</div>
                                                  <div>Practice Area ________2</div>
                                                  <div>Practice Area ________3</div>
                                                </div>
                                              </div>
                                              <div className="d-flex">
                                                <div className="m-r-1">
                                                  <i className="ion-ios-build fs-24"></i>
                                                </div>
                                                <div className="m-r-2">
                                                  <div>Skill ________1</div>
                                                  <div>Skill ________2</div>
                                                  <div>Skill ________3</div>
                                                </div>
                                                <div>
                                                  <div>Skill ________4</div>
                                                  <div>Skill ________5</div>
                                                  <div>Skill ________6</div>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="license align-center justify-content-start m-t-5p">
                                              <div>
                                                <i className={"ion-ios-finger-print"}></i>
                                              </div>
                                              <div>
                                                States Licensed To Practice In
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="d-flex justify-content-between m-t-1">
                                          <div className="d-flex">
                                            <button
                                              name="filter"
                                              className={"d-block btn-primary btn m-r-1"}
                                              disabled={true}
                                            >
                                              {' '}
                                              Message{' '}
                                            </button>
                                            <button
                                              name="filter"
                                              className={"d-block btn-primary btn m-r-1"}
                                              disabled={true}
                                            >
                                              {' '}
                                              Invite{' '}
                                            </button>
                                            <button
                                              name="filter"
                                              className={"d-block btn-primary btn"}
                                              disabled={true}
                                            >
                                              {' '}
                                              Remove{' '}
                                            </button>
                                          </div>
                                          {/* <div>
                                            <button
                                              name="filter"
                                              className={"d-block btn-primary btn"}
                                              disabled={true}
                                            >
                                              {' '}
                                              Detail{' '}
                                            </button>
                                          </div> */}
                                        </div>
                                      </div> : null
            }
            {
              this.props.attorneys.length == 0 ? null : attorney_list
            }
            {
              this.props.attorneys.length == 0 && this.props.isFiltered ? "No attorney" : null
            }
          </div>
        </div>
      </div>
    );
  }
}