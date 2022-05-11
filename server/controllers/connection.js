const mongoose = require('mongoose');
var rfr = require('rfr');
var helper = rfr('/server/models/shared/helper');
let config = rfr('/server/shared/config'),
  constant = rfr('/server/shared/constant'),
  mailHelper = rfr('/server/shared/mailHelper'),
  utils = rfr('/server/shared/utils');

const socket = require('socket.io');

const messages = require('./messages');
const chatrooms = require('./chatrooms');

var usersModel = mongoose.model('users');
const TIME_TO_WAIT_BEFORE_STORE_IN_DB = 15000;

const buildConnection = server => {
  const io = socket(server);

  let messagesToStoreInDb = [];
  let users = {};
  let chatRooms = {};

  io.sockets.on('connection', socket => {
    let myUserId='';
    let myChatRoomId='';
    let myName='';
    let myEmail='';
    var myReceivers=[];
    
    console.log('---socket connection done successfully---', socket.id);
    var user_exist_change = () =>{
      
    };

    socket.on('status', data=>{
      var avail={};
      switch(data.type){
        case 'register_receivers':
          myReceivers =[...data.users];
          myReceivers.filter((user)=>{
            avail[user] = !(!users[user]);
          });
          socket.emit('status', {'mode': 'users_exist', users: avail});
          break;
      }
    });
    
    socket.on('message', data => {
      //console.log('msg:',data,'socketid:',socket.id);
      if(!chatRooms[data.chatroom]){
        chatRooms[data.chatroom] =[];
      }
      if(chatRooms[data.chatroom].length>1){// both in chatroom
        io.to(data.chatroom).emit('message', data);
      }else{// only you in chatroom
        if(users[data.message.receiverId]){
          // push notification to receiver
          const pushData = {mode: 'notify', type: 'info', name: myName, msg: data.message.message};
          io.sockets.connected[users[data.message.receiverId].socketId].emit("notification",pushData);
        }else{
          usersModel.findOne({ _id: data.message.receiverId }, function(err, userData) {
            let mailObj = {
              senderName: myName,
              data: data,
              url: config['server']['end_point']+"/messages",
            };
            mailHelper.sendMailInBackground(
              userData['email'],
              '[Legably] ' + myName + ' sent you a message ',
              'CHAT_MESSAGE_TO_RECEIVER',
              mailObj
            );
          });
          
        }
      }
    });
    socket.on('disconnect', () => {
      //console.log('socket disconnected...', socket.id)

      // remove client in chatroom
      if(myChatRoomId!=''){
        if(chatRooms[myChatRoomId].indexOf(myUserId)>-1){
          chatRooms[myChatRoomId].splice(chatRooms[myChatRoomId].indexOf(myUserId), 1);
          //console.log('leaved chatroom id:', myChatRoomId)
        }
      }
      //remove client in users
      delete users[myUserId];
      user_exist_change(); 
      let pData={};
      pData[myUserId] = false;
      io.sockets.emit('status', {'mode': 'users_exist', users: pData});
    });
    socket.on('register', (data) => {
      myUserId = data.id;
      myEmail = data.email;
      myName = data.first_name + " " + data.last_name;
      if (data) {
        users[data.id] = { "socketId": socket.id, "userEmail": data.email }
      }
      let pData={};
      pData[myUserId] = true;
      io.sockets.emit('status', {'mode': 'users_exist', users: pData});
      user_exist_change(); 
    });

    socket.on('join', (chatRoomId) => {
      myChatRoomId = chatRoomId;
      if(!chatRooms[chatRoomId]){
        chatRooms[chatRoomId] =[];
      }
      chatRooms[chatRoomId].push(myUserId);
      socket.join(chatRoomId);
    });

    socket.on('leave', (chatRoomId) => {
      if(chatRoomId==""){
        if(!chatRooms[myChatRoomId]){
          chatRooms[myChatRoomId] =[];
        }
        if(chatRooms[myChatRoomId].indexOf(myUserId)>-1){
          chatRooms[myChatRoomId].splice(chatRooms[myChatRoomId].indexOf(myUserId), 1);
          socket.leave(myChatRoomId);
        }
      }else{
        if(!chatRooms[chatRoomId]){
          chatRooms[chatRoomId] =[];
        }
        if(chatRooms[chatRoomId].indexOf(myUserId)>-1){
          chatRooms[chatRoomId].splice(chatRooms[chatRoomId].indexOf(myUserId), 1);
          socket.leave(chatRoomId);
        }
      }
    });
  });
};

module.exports = {
  buildConnection
};
