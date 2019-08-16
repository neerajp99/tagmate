// Login.js
import React, {Component} from 'react'
import firebase, { config } from 'react-native-firebase';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import {loginUser, loginGoogleUser,addNewGoogleUser} from '../../actions';
import {populateUserServices, addNetworkDetails, setInitialThumbnail} from '../../lib/firebaseUtils';
import { StyleSheet, Text, TextInput, View, Button, Image, ImageBackground, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Video from 'react-native-video'
import bgImage from '../../img/background.jpg'
import logo from '../../img/logo.png'
import bgVideo from '../../vid/vid.mp4'
import {adourStyle} from '../style/AdourStyle'

const { width: WIDTH } = Dimensions.get('window')

class Login extends Component {
  state = { email: '', password: '', showPass: true, passPress: false, loading:false}


  handleLogin = () => {
    const { email, password } = this.state;

    // Ensuring no fields are empty:
    if(email == '' || password == '')
      {
        alert('Please fill all the fields.');
        return;
      }
    else this.props.loginUser({email, password});
  }

  componentDidMount() {
    this._isMounted = true;
    firebase.database().goOnline()
    GoogleSignin.configure({
      //It is mandatory to call this method before attempting to call signIn()
      /*
      This scope was used earlier:
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      */
      scopes: [],
      // Repleace with your webClientId generated from Firebase console
      webClientId:
        '522194578751-bobqbcmj48345s6klfkpi07rjkoni7a6.apps.googleusercontent.com',//'768462231622-jhd3lqdcujeoene1768arlnhepe11t3g.apps.googleusercontent.com',
      hostedDomain: '', // specifies a hosted domain restriction
      loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceConsentPrompt: true, // [Android] if you want to show the authorization prompt at each login. Test
    });

    firebase.analytics().setCurrentScreen('Login');

  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  _signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      this.setState({ user: null }); // Remember to remove the user from your app's state as well
    } catch (error) {
      console.error(error);
    }
  };

  _signIn = async () => {
    if(this.state.loading) return;
    try {
      this.setState({loading:true, invalid_email:false});
      await GoogleSignin.hasPlayServices({
        //Check if device has Google Play Services installed.
        //Always resolves to true on iOS.
        showPlayServicesUpdateDialog: true,
      });

      const isSignedIn = await GoogleSignin.isSignedIn();
      if(isSignedIn == true){
        await GoogleSignin.signOut();
      }
      const userInfo = await GoogleSignin.signIn();

      this.setState({ g_first_name: userInfo.user.givenName, g_last_name: userInfo.user.familyName, g_profile: userInfo.user.photo });

      // create a new firebase credential with the token
      const credential = firebase.auth.GoogleAuthProvider.credential(userInfo.idToken, userInfo.accessToken)
      // login with credential
      const currentUser = await firebase.auth().signInWithCredential(credential);

      //NOTE: Any change here must also be in Loading.js

      //India
      let eduIn = (currentUser.user.email.slice(-7) === '.edu.in');
      let acIn = (currentUser.user.email.slice(-6) === '.ac.in');
      //USA & others
      let edu = (currentUser.user.email.slice(-4) === '.edu');
      //UK
      let acUk = (currentUser.user.email.slice(-6) === '.ac.uk');

      let testAccount = (currentUser.user.email === 'chillmateapp@gmail.com');

      if(eduIn || acIn || edu || acUk || testAccount)
      {
        await addNewGoogleUser(currentUser.user.uid,this.state.g_first_name, this.state.g_last_name, this.state.g_profile);
        if(this._isMounted)
        {
          populateUserServices(currentUser).then(res => {
            addNetworkDetails(currentUser).then(secRes => {
              setInitialThumbnail(currentUser).then(lastRes => {
                this.setState({loading:false});
                AsyncStorage.getItem("alreadyLaunchedHome").then(value => {
                      if(value == null){
                          console.log('Taking the user to onboarding profile screen.')
                           this.props.navigation.navigate('NewUserSetProfile');
                           //We hope Home.js takes care of setting alreadyLaunchedHome to true
                      }
                      else{
                           console.log('Taking the user straight to Home. Not the first launch.')
                           this.props.navigation.navigate('MainStack');
                      }})

              })
            })
          })
        }
      }
      else if(this._isMounted)
      {
        this.setState({loading:false, invalid_email:true,});
        this._signOut();
      }
    } catch (error) {
      this.setState({loading:false});
      console.log('Message', error.message);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User Cancelled the Login Flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Signing In');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play Services Not Available or Outdated');
      } else {
        console.log('Some Other Error Happened');
      }
    }
  }


  handleLoading = () => {
    if(this.props.loading){
      return <ActivityIndicator />;
    } else {
      return <Text style={styles.text}> Login </Text>;
    }
  }

  showPass = () => {
    if (this.state.showPass == true) {
      this.setState({ showPass: false})
    } else {
      this.setState({ showPass: true})
    }
  }

  render() {
    return (
      <View style={styles.backgroundContainer}>
      <Video source={bgVideo} repeat resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
          <Text style={adourStyle.logoSubtitle}>Know what's happening on your campus</Text>
        </View>
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 5 }}>
            {this.props.error}
          </Text>
          {
            this.state.invalid_email &&
            <Text style={{ color: '#ff7e75', textAlign: 'center', marginTop: 5 }}>
              Please use your university email to login.
            </Text>
          }
          {/*
        <View style={styles.inputContainer}>
        <Icon name={'email'} size={25} color={'rgba(255, 255, 255, 0.7)'} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Email"
          placeholderTextColor={'rgba(255, 255, 255, 0.7)'}
          underlineColorAndroid='transparent'
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        </View>

        <View style={styles.inputContainer}>
        <Icon name={'lock-outline'} size={25} color={'rgba(255, 255, 255, 0.7)'} style={styles.inputIcon} />
        <TextInput
          secureTextEntry={this.state.showPass}
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Password"
          placeholderTextColor={'rgba(255, 255, 255, 0.7)'}
          underlineColorAndroid='transparent'
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <TouchableOpacity style={styles.btnEye} onPress={this.showPass}>
          <Ionicons name={this.state.showPass == true ? 'ios-eye' : 'ios-eye-off'} size={25} color={'rgba(255, 255, 255, 0.5)'} />
        </TouchableOpacity>

        </View>

        <TouchableOpacity style={styles.btnLogin} onPress={this.handleLogin}>
          {this.handleLoading()}
        </TouchableOpacity>
        <Text style={styles.clickableText} onPress={() => this.props.navigation.navigate('SignUp')} >
          New to Adour? Sign Up
        </Text>
        */}

        {
          this.state.loading && <View style={{marginBottom: 15}}>
                                    <ActivityIndicator size="large" color="white" />
                                </View>
        }


        <GoogleSigninButton style={styles.btnGoogleLogin} disabled={this.state.loading}  size ={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Light} onPress={this._signIn}/>

        {Platform.OS === 'ios' && <Text style={styles.clickableText} onPress={() => this.props.navigation.navigate('EmailLogin', {navigation: this.props.navigation })} >
          Sign-In Using Email and Password
        </Text>}

      </View>
      </View>
    )
  }
}
const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    width: null,
    height: null,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'purple'
  },
  textInput: {
    height: 45,
    width: WIDTH - 55,
    borderRadius: 45,
    fontSize: 16,
    paddingLeft: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  logoContainer: {
    alignItems: 'center'
  },
  logo: {
    height: 71,
    width: 250,
    marginBottom: 2
  },
  inputIcon: {
    position: 'absolute',
    top: 10,
    left: 12
  },
  inputContainer: {
    marginTop: 10
  },
  btnLogin: {
    width: WIDTH - 55,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#432577',
    justifyContent: 'center',
    marginTop: 20
  },
  btnGoogleLogin: {
    width: 312,
    height: 48,
    marginBottom: 35
  },
  btnEye: {
    position: 'absolute',
    top: 8,
    right: 16
  },
  text: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center'
  },
  clickableText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28
  }
})

const mapStateToProps = state => {
  /* only return the property that we care about */
  return{
    error: state.auth.error,
    loading: state.auth.loading
  };
};

export default connect(mapStateToProps, {loginUser}) (Login);
