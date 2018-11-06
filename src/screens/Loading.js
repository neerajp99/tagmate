import React, {Component} from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import firebase from 'react-native-firebase';

class Loading extends Component {

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      this.props.navigation.navigate(user ? 'MainStack' : 'SignUp')
    })
  }

  render() {
    return (
      <View>
        <Text>Loading</Text>
        <ActivityIndicator size="large" />
      </View>
    )
  }
}

export {Loading};
