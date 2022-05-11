import React from 'react';

export default class Loader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isHide : true
    }
  }

  componentDidMount() {
    let _this = this;
    if(this.props.isShow) {
      _this.setState({
        isHide: false
      });
    }else{

    }
  }

  render() {
    const { isHide } = this.state;
    return (
      <div id="legably_loader" className={isHide ? 'fade-layer hide' : 'fade-layer'}>
        <div className="loader"></div>
      </div>
    );
  }
}
