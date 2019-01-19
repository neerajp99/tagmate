import React, {Component} from 'react';
import {View, WebView} from 'react-native';

class ToS extends Component{

    render() {
      return (
          <WebView
        source={{uri: 'http://getadour.com/app/tos.html'}}
        style={{marginTop: 20}}
      />
      )
    }

}

export {ToS};
