import React from 'react';
import Messenger from './Messenger';
import { Dashboard } from '../index';

export default class MessageView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  render() {
    return (
      <Dashboard>
        <section className="chat-wrapper">
          <Messenger jobId={this.props.params.jobId} />  
        </section>
      </Dashboard>
    );
  }
}