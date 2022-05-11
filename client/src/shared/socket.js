import io from 'socket.io-client';
import { config, constant, helper, utils, sessionManager } from './index';

const Socket = () => {
  let apiConfig = config.getConfiguration();
  const socket = io(apiConfig.API_ENDPOINT);
  
  socket.on('connect', (...rest) => {
    // console.log('client connected!');
    // console.log(rest);
    var userData = utils.getCurrentUser();
    socket.emit('register', userData);
  });

  const registerHandler = (onMessageReceived) => {
    socket.on('message', onMessageReceived);
  };

  const unregisterHandler = () => {
    socket.off('message');
  };

  const registerPushHandler = (onMessageReceived) => {
    socket.on('notification', onMessageReceived);
  };

  const unregisterPushHandler = () => {
    socket.off('notification');
  };
  const registerStatusHandler = (onMessageReceived) => {
    socket.on('status', onMessageReceived);
  };

  const unregisterStatusHandler = () => {
    socket.off('status');
  };
  socket.on('error', (err) => {
    console.log('received socket error:');
    console.log(err);
  });

  const register = (email, cb) => {
    socket.emit('register', email, cb);
  };

  const join = (chatroom, cb) => {
    socket.emit('join', chatroom, cb);
  };

  const leave = (chatroom, cb) => {
    socket.emit('leave', chatroom, cb);
  };

  const message = (chatroom, msg, cb) => {
    socket.emit('message', { chatroom, message: msg }, cb);
  };

  const sendStatus = (msg, cb) => {
    socket.emit('status', msg, cb);
  };

  const getChatrooms = (cb) => {
    socket.emit('chatrooms', null, cb);
  };

  const getChatroomUsers = (chatroom, cb) => {
    socket.emit('chatroomUsers', chatroom, cb);
  };

  const updateChatrooms = () => {
    socket.emit('updateChatrooms');
  };

  return {
    register,
    join,
    leave,
    message,
    getChatrooms,
    getChatroomUsers,
    updateChatrooms,
    registerHandler,
    unregisterHandler,
    registerPushHandler,
    unregisterPushHandler,
    registerStatusHandler,
    unregisterStatusHandler,
    sendStatus,
  };
};

export default (() => {
  let instance;

  const createInstance = () => {
    return Socket();
  };

  return {
    io: () => {
      if (sessionManager.isSession()){
        if (!instance) {
          instance = createInstance();
        }
        return instance;
      }else{
        return null;
      }
    }
  };
})();
