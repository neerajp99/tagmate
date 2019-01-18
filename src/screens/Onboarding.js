import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import firebase from 'react-native-firebase';
import AddDetails from './auth/AddDetails';

const { width: WIDTH } = Dimensions.get('window')

class Onboarding extends Component{

  /*navigateToMainStack(){
    this.props.navigation.navigate('MainStack');
  }*/

  render(){
    const {currentUser: {uid} = {}} = firebase.auth()
    return(
      <View style={styles.backgroundContainer}>
        {/* <Text>{firebase.auth().currentUser.uid}</Text> */}
        <AddDetails onboarding={this.props.navigation} userId={uid} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8
  },
  btn: {
    width: WIDTH - 20,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'darkgrey',
    justifyContent: 'center',
    marginTop: 20
  },
  titleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'left'
  },
  subtitleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 20,
    fontWeight: '200',
    textAlign: 'left'
  },
  headerContainer: {
    paddingLeft: 10,
    marginTop: 20,
    marginBottom: 15
  },
  btnText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    textAlign: 'center'
  }
})


export {Onboarding};
