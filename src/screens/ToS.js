import React, {Component} from 'react';
import {View, WebView} from 'react-native';

class ToS extends Component{

    render() {
      return (
        <View style={{ flex: 1 }}>
          <WebView
              source={{uri: 'http://chillmateapp.com/legal/tos.html'}}
              style={{ flex: 1 }}
          />
        </View>
      )
    }

}

export {ToS};
