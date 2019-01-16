import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import { ListItem, Card } from 'react-native-elements';
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AddDetails from './auth/AddDetails';
import {getCoins, listenForChange} from '../lib/firebaseUtils.js';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';

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
    GoogleSignin.configure({
      //It is mandatory to call this method before attempting to call signIn()
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      // Repleace with your webClientId generated from Firebase console
      webClientId:
        '768462231622-jhd3lqdcujeoene1768arlnhepe11t3g.apps.googleusercontent.com',//'768462231622-jhd3lqdcujeoene1768arlnhepe11t3g.apps.googleusercontent.com',
      hostedDomain: '', // specifies a hosted domain restriction
      loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceConsentPrompt: true, // [Android] if you want to show the authorization prompt at each login.
    });
  }

  loadWhatsapp = () =>
  {
    Linking.openURL('whatsapp://send?text=Hey, checkout Adour: http://getadour.com')
  }

  updateCoins = () =>
  {
    const {currentUser: {uid} = {}} = firebase.auth()
    firebase.database().ref(`/users/${uid}/coins`).on("value", function(snapshot)
    {
      this.setState({coins: snapshot.val() || "0"});
    }.bind(this));
  }

  render(){
    return(
      <View style={styles.backgroundContainer}>
        {/* <Text>Email: {this.state.email}</Text> */}
        <Card>
          <ListItem
            title={this.state.coins}
            subtitle='Adour Coins'
            subtitleStyle={{fontWeight:'100'}}
            leftIcon={{ name: 'coins', type:'material-community' }}
            hideChevron={true}
            containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
          />
        </Card>


        <Card>
          <ListItem
            title='Edit Details'
            leftIcon={{ name: 'mode-edit' }}
            onPress={() => this.props.navigation.navigate('EditProfileDetails')}
          />
          <ListItem
            title='Invite A Friend'
            leftIcon={{ name: 'person-add' }}
            onPress={()=>{this.loadWhatsapp()}}
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
            onPress={async () => {
              try {
                const isSignedIn = await GoogleSignin.isSignedIn();
                if(isSignedIn == true){
                  await GoogleSignin.signOut();
                }
                firebase.auth().signOut();
              }
              catch (error) {
                console.log(error);
              }
            }}
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
