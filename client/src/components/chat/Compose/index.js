import React, { Component } from 'react';
import { Picker, emojiIndex } from 'emoji-mart';
import Dropzone from 'react-dropzone';
import { constant, utils } from '../../../shared/index';
import config from '../../../shared/config';

class Compose extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      showEmojiPicker: false,
      showAttachFile: false,
      acceptedFiles: []
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}
  // send the chat message through socket
  sendMessage(event) {
    event.persist();

    // if the ENTER key is pressed emit the message
    if ((event.keyCode == 13 || event.which == 13) && !event.ctrlKey) {
      //let message = this.state.message.replace(this.state.message.charAt(this.state.message.length - 1), "");
      let message = this.state.message;

      // emit the message
      if (message.length > 0) {
        //this.socket.emit('message', data)
        let { onNewMessageArrival } = this.props;
        onNewMessageArrival(message);
      }

      // reset the input text value
      this.setState({
        message: '',
        showAttachFile: false
      });
    } else if ((event.keyCode == 13 || event.which == 13) && event.ctrlKey) {
      alert('control enter');
      this.setState({
        message: event.target.value + '\n'
      });
    }
  }
  toggleEmojiPicker() {
    this.setState({
      showEmojiPicker: !this.state.showEmojiPicker
    });
  }

  // Zoom Call
  toggleZoomCall() {
    console.log("this is zoom call button.");
  }

  //DropZone-------
  toggleAttachFile() {
    var inputs = document.getElementsByTagName('input');
    // var inputs = document.getElementsByClassName('dropzone');
    // inputs[0].click();
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].getAttribute('type') == 'file') {
        inputs[i].click();
      }
    }
  }

  onDrop(acceptedFiles) {
    console.log("on drop event")
    if (acceptedFiles.length === 0) {
      return;
    } else if (acceptedFiles.length > constant['MAX_UPLOAD_FILE_COUNTS']) {
      utils.flashMsg('show', 'You have exceeded the limit of file uploads');
      return;
    }
    this.setState({
      showAttachFile: true
    });
    const curFiles = this.state.acceptedFiles;
    this.setState({ acceptedFiles: curFiles.concat(acceptedFiles) });
  }
  fileSize(size) {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  fileType(fileName) {
    return (
      fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length) ||
      fileName
    );
  }

  removeFile(name) {
    // find the index of the item
    // remove the item from array
    const index = this.state.acceptedFiles.findIndex(e => e.name === name);
    const tempFiles = this.state.acceptedFiles;
    tempFiles.splice(index, 1);
    // update acceptedFiles array
    this.setState({ acceptedFiles: tempFiles });
  }

  handleChange(event) {
    event.persist();

    this.setState({
      message: event.target.value
    });
  }
  addEmoji(emoji) {
    const { message } = this.state;
    const text = `${message}${emoji.native}`;
    this.setState({
      message: text,
      showEmojiPicker: false
    });
    document.getElementsByClassName('compose-input')[0].focus();
  }

  render() {
    return (
      <div className="compose">
        <input
          type="text"
          className="compose-input"
          placeholder="Compose your message and hit ENTER to send"
          onChange={this.handleChange.bind(this)}
          onKeyPress={this.sendMessage.bind(this)}
          value={this.state.message}
        />
        {/* {this.props.rightItems} */}
        <div
          className="emoji-pane"
          style={{ position: 'fixed', bottom: '50px', zIndex: 100 }}
        >
          {this.state.showEmojiPicker ? (
            <Picker emoji="point_up" onSelect={this.addEmoji.bind(this)} />
          ) : null}
        </div>

        <div
          className="attach-file-pane"
          style={{
            position: 'absolute',
            bottom: '60px',
            zIndex: 101,
            width: '400px',
            height: 'max-content',
            display: this.state.showAttachFile ? 'block' : 'none'
          }}
        >
          <div className="file-display-container">
            {this.state.acceptedFiles.map((data, i) => (
              <div className="file-status-bar" key={i}>
                <div>
                  <div className="file-type-logo"></div>
                  <div className="file-type">{this.fileType(data.name)}</div>
                  <span
                    className={`file-name ${data.invalid ? 'file-error' : ''}`}
                  >
                    {data.name}
                  </span>
                  <span className="file-size">
                    ({this.fileSize(data.size)})
                  </span>
                </div>
                <div
                  className="file-remove"
                  onClick={() => this.removeFile(data.name)}
                >
                  X
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'none' }}>
          <Dropzone
            onDrop={this.onDrop.bind(this)}
            onDropRejected={this.onDropRejected}
            minSize={0}
            maxSize={constant['MAX_UPLOAD_FILE_SIZE']}
            multiple
          >
            {({ getRootProps, getInputProps, isDragActive, isDragReject }) => {
              return (
                <div {...getRootProps()} className="dropzone">
                  <input {...getInputProps()} />
                </div>
              );
            }}
          </Dropzone>
        </div>
        <i
          className="toolbar-button ion-ios-attach"
          onClick={this.toggleAttachFile.bind(this)}
        ></i>
        <i
          className="toolbar-button ion-ios-call"
          onClick={this.toggleZoomCall.bind(this)}
        ></i>
        <i
          className="toolbar-button ion-ios-happy"
          onClick={this.toggleEmojiPicker.bind(this)}
        ></i>
      </div>
    );
  }
}

export default Compose;
