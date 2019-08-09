import React, {Component} from 'react';
import {View, WebView, ActivityIndicator} from 'react-native';
import firebase from 'react-native-firebase';
import {BRAND_COLOR_ONE} from './style/AdourStyle';

class PrivacyPolicyScreen extends Component{

  constructor(props) {
      super(props);
      this.state = { visible: true };
    }

    hideSpinner() {
      this.setState({ visible: false });
    }

    componentDidMount(){
      firebase.analytics().setCurrentScreen('PrivacyPolicy');
    }

    render() {
      return (
        <View style={{ flex: 1 }}>
          {this.state.visible && (
              <ActivityIndicator
                style={{top: 20, left: 20}}
                color={BRAND_COLOR_ONE}
                size="large"
              />
          )}
          <WebView
            onLoad={() => this.hideSpinner()}
            style={{ flex: 1 }}
            source={{ uri: 'https://tagmateapp.com/legal/privacypolicy.html' }}
          />
        </View>
      )
    }

}

export {PrivacyPolicyScreen};
