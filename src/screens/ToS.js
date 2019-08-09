import React, {Component} from 'react';
import {View, WebView} from 'react-native';
import firebase from 'react-native-firebase';

class ToS extends Component{

  componentDidMount(){
    firebase.analytics().setCurrentScreen('ToS');
  }

    render() {
      return (
        <View style={{ flex: 1 }}>
          <WebView
              source={{uri: 'https://tagmateapp.com/legal/tos.html'}}
              style={{ flex: 1 }}
          />
        </View>
      )
    }

}

export {ToS};
