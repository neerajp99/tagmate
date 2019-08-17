import React, {Component} from 'react';
import {View, Text} from 'react-native';
import {Card} from 'react-native-elements';
import firebase from 'react-native-firebase';
import {adourStyle} from './style/AdourStyle';

class BlockAccess extends Component{

  constructor(props) {
    super(props);
    this.state = {
      reasonForBlock: this.props.navigation.state.params.reason,
    }

  }

  componentDidMount(){
    firebase.analytics().setCurrentScreen('blockAccess');
  }

    render() {
      return (
        <View style={adourStyle.mainContainer}>
        <Card>
          <Text style={adourStyle.defaultText}>{this.state.reasonForBlock}</Text>
        </Card>
        </View>
      )
    }

}

export {BlockAccess};
