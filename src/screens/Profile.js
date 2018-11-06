import React, {Component} from 'react';
import {View, Text, Button} from 'react-native';
import firebase from 'react-native-firebase';
import AddDetails from './auth/AddDetails';

class ProfileScreen extends Component{

  handleSignout = () => {
      firebase
        .auth()
        .signOut()
  }


  render(){
    return(
      <View>
        <Text>{firebase.auth().currentUser.uid}</Text>
        <Text>Profile Screen</Text>
        <AddDetails />
        <Button title="Sign Out" onPress={() => firebase.auth().signOut()} />
      </View>
    )
  }
}

export {ProfileScreen};
