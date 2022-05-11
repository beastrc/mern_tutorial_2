import React from 'react';
import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import axios from 'axios';
import { constant, utils } from '../../../shared/index';
import Socket from '../../../shared/socket';
// import './Messenger.css';

export default class Messenger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conversations: [],
      selectedChatRoom: {},
      keyword: '',
      toggleMenuShow: true,
    };
    this.getConversations = this.getConversations.bind(this);
    this.onClickChatRoom = this.onClickChatRoom.bind(this);
    this.onSearchHandle = this.onSearchHandle.bind(this);
    this.toggleHamburger = this.toggleHamburger.bind(this);
  }
  componentDidMount() {
    
    var _this = this;
    if(Socket.io()){
      Socket.io().registerStatusHandler(data => {
        if(data.mode == 'users_exist'){
          let convs = [...this.state.conversations];
          convs.filter((con)=>{
            if(data.users[con.receiverId]!=undefined){
              con.avail = data.users[con.receiverId];
            }else{

            }
          })
          // console.log(convs);
          this.setState({conversations: convs})
        }
      });
    }
    this.getConversations();
  }
  componentWillUnmount(){
    if(Socket.io()){
      Socket.io().unregisterStatusHandler();
    }
  }

  onSearchHandle(keyword) {
    this.setState({ keyword: keyword }, () => {
      this.getConversations();
    });
  }

  componentWillReceiveProps(nextProps) {}

  toggleHamburger(){
    this.setState({toggleMenuShow:!this.state.toggleMenuShow});
  }
  getConversations() {
    // console.log('get conversation called');
    let that = this;
    utils.apiCall(
      'GET_CHAT_ROOMS',
      { data: { keyword: this.state.keyword } },
      function(err, response) {
        if (err) {
          utils.flashMsg('show', 'Error while getting chat rooms');
          utils.logger('error', 'Get chat room error -->', err);
        } else {
          if (utils.isResSuccess(response)) {
            if (response.data.results.chatrooms.length > 0) {
              var sel_id = 0;
              var receivers = [];
              let newConversations = response.data.results.chatrooms.map(
                (result, key) => {
                  let userData = utils.getCurrentUser();
                  var name = '';
                  var photo = '';
                  var type = ''; //poster or seeker
                  if (that.props.jobId == result.job_id){
                    sel_id = key;
                  }
                  if (userData.id == result.user_seeker._id) {
                    type = 'Poster';
                    name = `${result.user_poster.first_name} ${result.user_poster.last_name}`;
                    photo =
                      result.room_avatar == null
                        ? '/images/default-profile-pic.png'
                        : result.room_avatar;
                  } else {
                    type = 'Seeker';
                    name = `${result.user_seeker.first_name} ${result.user_seeker.last_name}`;
                    photo =
                      result.room_avatar == null
                        ? '/images/default-profile-pic.png'
                        : result.room_avatar;
                  }
                  receivers.push(userData.id == result.user_seeker._id? result.user_poster._id: result.user_seeker._id);
                  return {
                    id: result._id,
                    photo: photo,
                    name: name,
                    type: type,
                    text: (result.room_title.length>20)?result.room_title.substr(0,20)+"...":result.room_title,
                    senderId:
                      userData.id == result.user_seeker._id
                        ? result.user_seeker._id
                        : result.user_poster._id,
                    receiverId:
                      userData.id == result.user_poster._id
                        ? result.user_seeker._id
                        : result.user_poster._id
                  };
                }
              );
              that.setState({
                conversations: newConversations,
                selectedChatRoom: newConversations[sel_id]
              },()=>{
                Socket.io().sendStatus({type:'register_receivers', users: receivers});
              });
            } else {
              that.setState({
                conversations: [],
                selectedChatRoom: {}
              });
            }
          }
        }
      }
    );
  }

  onClickChatRoom(id) {
    this.setState({ selectedChatRoom: this.state.conversations[id], toggleMenuShow:false });
    this.setState({});
    // console.log('conversation', this.state.conversations);
    /*let params = {
      chatroom: id,
    }
    this.setState({selectedChatRoomId: id});
    utils.setLegablyStorage('current_chatroom', id);
    ///console.log(utils.getLegablyStorage('current_chatroom')[0]);
    utils.apiCall('GET_MESSAGES', { 'get_params': params }, function (err, response) {
      if (err) {
        utils.flashMsg('show', 'Error while getting chat rooms');
        utils.logger('error', 'Get chat room error -->', err);
      } else {
        console.log(response);
      }
    });

    */
  }

  render() {
    console.log("job id:", this.props.jobId)
    return (
      <div className="messenger">
        {/* <Toolbar
            title="Messenger"
            leftItems={[
              <ToolbarButton key="cog" icon="ion-ios-cog" />
            ]}
            rightItems={[
              <ToolbarButton key="add" icon="ion-ios-add-circle-outline" />
            ]}
          /> */}

        {/* <Toolbar
            title="Conversation Title"
            rightItems={[
              <ToolbarButton key="info" icon="ion-ios-information-circle-outline" />,
              <ToolbarButton key="video" icon="ion-ios-videocam" />,
              <ToolbarButton key="phone" icon="ion-ios-call" />
            ]}
          /> */}
        <aside className="d-flex sidebar-wrapper pull-left" onClick={this.toggleHamburger}>
          <a className="main-nav left hamburger-icon" >
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </a>
        </aside>

        <div className={this.state.toggleMenuShow?"scrollable sidebar mobile-view":"scrollable sidebar mobile-hide"} 
          style={{width:'300px'}}>
          <ConversationList
            conversations={this.state.conversations}
            selectedChatRoom={this.state.selectedChatRoom}
            onClickChatRoom={this.onClickChatRoom}
            onSearchHandle={this.onSearchHandle}
          />
        </div>

        <div className="content" id="scroll_message_list">
          <MessageList ChatRoom={this.state.selectedChatRoom} />
        </div>
      </div>
    );
  }
}
