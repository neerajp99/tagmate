import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking, Image, ScrollView} from 'react-native';
import { ListItem, Card, Avatar } from 'react-native-elements';
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AddDetails from './auth/AddDetails';
import {getCoins, listenForChange} from '../lib/firebaseUtils.js';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import {adourStyle} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')

class ProfileScreen extends Component{
  constructor(props) {
    super(props);
    this.state = {coins: 'Loading...'}; // Message to show while Adour coins are being loaded
    this.updateCoins = this.updateCoins.bind(this);
  }

  handleSignout = () => {
      firebase
        .auth()
        .signOut().then(
          this.props.navigation.navigate('Login')
        )
  }

  componentDidMount(){
    this._isMounted = true;
    //Fetching name and photo URL
    const {currentUser: {displayName, photoURL} = {}} = firebase.auth();
    this.setState({displayName, photoURL});
    // Updating Adour coin balance
    this.updateCoins();
    GoogleSignin.configure({
      //It is mandatory to call this method before attempting to call signIn()
      /*
      Scope used earlier:
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      */
      scopes: [],
      // Repleace with your webClientId generated from Firebase console
      webClientId:
        '522194578751-bobqbcmj48345s6klfkpi07rjkoni7a6.apps.googleusercontent.com',//'768462231622-jhd3lqdcujeoene1768arlnhepe11t3g.apps.googleusercontent.com',
      hostedDomain: '', // specifies a hosted domain restriction
      loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceConsentPrompt: true, // [Android] if you want to show the authorization prompt at each login.
    });
  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  loadWhatsapp = () =>
  {
    // Triggering the app to open whatsapp with a preloaded message.
    Linking.openURL('whatsapp://send?text=Hey, checkout Chillmate. I use it to meet new people over activities - http://ChillmateApp.com')
  }

  // This functions expects the user to be logged in.
  // It, in real-time, updates the Adour coin balance of the user.
  updateCoins = () =>
  {
    const {currentUser: {uid} = {}} = firebase.auth()
    firebase.database().ref(`/users/${uid}/coins`).on("value", function(snapshot)
    {
      if(this._isMounted) this.setState({coins: snapshot.val() || "0"});
    }.bind(this));
  }

  render(){
    return(
      <ScrollView>
      <View style={styles.backgroundContainer}>
        {
          this.state.displayName != "" &&
            <Card containerStyle={{alignItems: 'center', justifyContent: 'center'}}>
            <View style={{alignItems: 'center', marginBottom: 8}} >
              <Avatar
                size="large"
                rounded
                source={{uri: this.state.photoURL}}
                activeOpacity={0.7}
              />
              </View>
              <Text style={adourStyle.titleText}>{this.state.displayName}</Text>
            </Card>
        }

        <Card>
          <ListItem
            title={this.state.coins}
            titleStyle={adourStyle.listItemText}
            subtitle='Reputation'
            subtitleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'coins', type:'material-community' }}
            chevron={false}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
          />
        </Card>


        <Card title="Account" titleStyle={adourStyle.cardTitleSmall}>
          <ListItem
            title='My Interests'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'mode-edit' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={() => this.props.navigation.navigate('EditProfileDetails')}
          />
          <ListItem
            title='Invite A Friend'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'person-add' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={()=>{this.loadWhatsapp()}}
          />
          <ListItem
            title='Support'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'help-outline' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={() => this.props.navigation.navigate('SupportScreen')}
          />

          </Card>

          <Card title="Legal" titleStyle={adourStyle.cardTitleSmall}>
          <ListItem
            title='Privacy Policy'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'https' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={() => this.props.navigation.navigate('PrivacyPolicyScreen')}
          />
          <ListItem
            title='Terms of Service'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'info-outline' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={() => this.props.navigation.navigate('ToS')}
          />

          </Card>

          <Card>
          <ListItem
            title='Logout'
            titleStyle={adourStyle.listItemText}
            leftIcon={{ name: 'exit-to-app' }}
            containerStyle={{borderBottomColor: '#e6e6e6'}}
            onPress={async () => {
              try {
                const isSignedIn = await GoogleSignin.isSignedIn();
                if(isSignedIn == true){
                  await GoogleSignin.signOut();
                  this.props.navigation.navigate('Login')
                }
                firebase.auth().signOut();
              }
              catch (error) {
                console.log(error);
              }
            }}
          />
        </Card>
        <View style={{marginTop: 25}} />
      </View>
      </ScrollView>
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
