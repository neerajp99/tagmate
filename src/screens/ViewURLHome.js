import React, {Component} from 'react';
import {View, WebView} from 'react-native';
import firebase from 'react-native-firebase';

class ViewURLHome extends Component{

  constructor(props) {
    super(props);
    this.state = {
      urlAddress:this.props.navigation.state.params.urlAddress
    };
  }

  componentDidMount(){
    firebase.analytics().setCurrentScreen('ViewURLHome');
  }

    render() {
      const {urlAddress} = this.state;

      return (
        <View style={{ flex: 1 }}>
          <WebView
              source={{uri: urlAddress }}
              style={{ flex: 1 }}
          />
        </View>
      )
    }

}

export {ViewURLHome};
