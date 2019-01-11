import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator} from 'react-native';
import { ListItem, Card } from 'react-native-elements';
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AddDetails from './auth/AddDetails';
import {getCoins, listenForChange} from '../lib/firebaseUtils.js';

const { width: WIDTH } = Dimensions.get('window')

class ProfileScreen extends Component{
  constructor(props) {
    super(props);
    this.state = {coins: 'Loading...',email:'Loading...'};
    this.updateCoins = this.updateCoins.bind(this);
  }


  handleSignout = () => {
      firebase
        .auth()
        .signOut()
  }

  componentDidMount(){
    this.updateCoins();
  }

  updateCoins = () => 
  {
    const {currentUser: {uid} = {}} = firebase.auth()
    firebase.database().ref(`/users/${uid}/coins`).on("value", function(snapshot)
    {
      this.setState({coins: snapshot.val()});
    }.bind(this));
  }

  render(){
    return(
      <View style={styles.backgroundContainer}>
        {<Text>Adour Coins: {this.state.coins}</Text>}
        {<Text>Email: {this.state.email}</Text>}
        <Card>
          <ListItem
            title='Edit Details'
            leftIcon={{ name: 'mode-edit' }}
            onPress={() => this.props.navigation.navigate('EditProfileDetails')}
          />
          <ListItem
            title='Support'
            leftIcon={{ name: 'help-outline' }}
            onPress={() => alert('WIP')}
          />
          <ListItem
            title='Privacy Policy'
            leftIcon={{ name: 'mode-edit' }}
            onPress={() => alert('WIP')}
          />
          <ListItem
            title='Logout'
            leftIcon={{ name: 'exit-to-app' }}
            onPress={() => firebase.auth().signOut()}
          />
        </Card>

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
  btnText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    textAlign: 'center'
  }
})


export {ProfileScreen};
