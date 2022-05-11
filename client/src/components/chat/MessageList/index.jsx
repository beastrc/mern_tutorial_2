import React from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import io from 'socket.io-client';
import { config, constant, helper, utils } from '../../../shared/index';
import Socket from '../../../shared/socket';

// import './MessageList.css';


export default class MessageList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [
        {
          id: 1,
          senderId: 'apple',
          message: '',
          timestamp: new Date().getTime()
        }
      ],
      myId: '',
      showEmojis: false
    };
    this.renderMessages = this.renderMessages.bind(this);
  }
  componentDidMount() {
    var _this = this;
    Socket.io().registerHandler(data => {
      _this.onNewMessageReceived(data.message);
    })
  }
  componentWillUnmount(){
    Socket.io().leave("");
    Socket.io().unregisterHandler();
  }

  componentWillReceiveProps(nextProps) {
    var _this = this;
    // console.log("nextprops", nextProps.ChatRoom.id, "thisprops",this.props.ChatRoom.id) ;
    if (this.props.ChatRoom.id !== undefined) {
      if (this.props.ChatRoom.id != nextProps.ChatRoom.id) {
        Socket.io().leave(this.props.ChatRoom.id);
      }
    }
    if (nextProps.ChatRoom.id !== undefined) {
      if (this.props.ChatRoom.id != nextProps.ChatRoom.id) {
        Socket.io().join(nextProps.ChatRoom.id);
      }
      this.setState({ myId: nextProps.ChatRoom.senderId });

      let params = {
        chatroom: nextProps.ChatRoom.id
      };
      utils.apiCall('GET_MESSAGES', { get_params: params }, function(
        err,
        response
      ) {
        if (err) {
          utils.flashMsg('show', 'Error while getting chat rooms');
          utils.logger('error', 'Get chat room error -->', err);
        } else {
          _this.setState({ messages: [...response.data] }, () => {
            _this.scrollToLastMessage();
          });
        }
      });
    }
  }

  showEmojis(e) {
    this.setState(
      {
        showEmojis: true
      },
      () => document.addEventListener('click', this.closeMenu)
    );
  }

  onNewMessageReceived(msgObj) {
    var messages = this.state.messages;
    messages.push(msgObj);
    var _this = this;
    this.setState({ messages: messages }, () => {
      _this.scrollToLastMessage();
    });
  }

  onNewMessageArrival(data) {
    const newMessage = {
      id: uuidv4(),
      chatroom: this.props.ChatRoom.id,
      senderId: this.props.ChatRoom.senderId,
      receiverId: this.props.ChatRoom.receiverId,
      message: data,
      timestamp: new Date().getTime()
    };
    //create new message in db
    utils.apiCall(
      'CREATE_MESSAGE',
      { data: newMessage },
      (c_err, c_response) => {
        if (c_err) {
          utils.flashMsg('show', 'Error while creating message');
          utils.logger('error', 'Save rating error -->', c_err);
        } else {
          if (utils.isResSuccess(c_response)) {
          }
        }
      }
    );

    // this.socket.emit('message', newMessage); //send message to server
    var cb = (response) =>{
      //alert(response.status);
      alert("sent");
    }
    Socket.io().message(this.props.ChatRoom.id, newMessage, cb);

    var messages = this.state.messages;
    // messages.push(newMessage);
    var _this = this;
    this.setState({ messages: messages }, () => {
      _this.scrollToLastMessage();
    });
  }
  scrollToLastMessage() {
    var els = document.getElementsByClassName('message');
    if (els.length > 0) {
      els[els.length - 1].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }

  renderMessages() {
    let i = 0;
    let messages = this.state.messages;
    let messageCount = messages.length;
    let tempMessages = [];

    while (i < messageCount) {
      let previous = messages[i - 1];
      let current = messages[i];
      let next = messages[i + 1];
      let isMine = current.senderId === this.props.ChatRoom.senderId;
      let currentMoment = moment(current.timestamp);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;

      if (previous) {
        let previousMoment = moment(previous.timestamp);
        let previousDuration = moment.duration(
          currentMoment.diff(previousMoment)
        );
        prevBySameAuthor = previous.senderId === current.senderId;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('seconds') < 60) {
          showTimestamp = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.timestamp);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.senderId === current.senderId;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }

      tempMessages.push(
        <Message
          key={i}
          isMine={isMine}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          data={current}
        />
      );

      // Proceed to the next message.
      i += 1;
    }

    return tempMessages;
  }

  render() {
    return (
      <div className="message-list">
        {/* <Toolbar
          title="Conversation Title"
          rightItems={[
            <ToolbarButton
              key="info"
              icon="ion-ios-information-circle-outline"
            />,
            <ToolbarButton key="video" icon="ion-ios-videocam" />,
            <ToolbarButton key="phone" icon="ion-ios-call" />
          ]}
        /> */}

        <div className="message-list-container">{this.renderMessages()}</div>

        <Compose
          onNewMessageArrival={this.onNewMessageArrival.bind(this)}
          rightItems={[
            <ToolbarButton key="money" icon="ion-ios-card" />,
            <ToolbarButton key="emoji" icon="ion-ios-happy" />,
            <ToolbarButton key="games" icon="ion-logo-game-controller-b" />
          ]}
        />
      </div>
    );
  }
}
