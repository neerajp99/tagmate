// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import { StyleSheet, Text, TextInput, View, Button, Image, ImageBackground, Dimensions, TouchableOpacity, ActivityIndicator  } from 'react-native';
import {connect} from 'react-redux';
import {loginUser} from '../../actions';
import Icon from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import bgImage from '../../img/background.jpg'
import logo from '../../img/logo.png'
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';

//Note: this has a lot of unused garbage code. Please clean it.

const { width: WIDTH } = Dimensions.get('window')
const { height: HEIGHT } = Dimensions.get('window')

class EmailLogin extends Component {

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      success: false,
      showPass: true
    };
  }

  componentDidMount(){
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        () => this.props.navigation.navigate('MainStack')

      } else {
        // User is signed out.
        // ...
      }
    });
  }

  loginUser = () => {
    const {email, password} = this.state;
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(user => this.props.navigation.navigate('MainStack'))
      .catch( (err) => {
        alert(err.message)})

  }

  handleSignIn = () => {
      console.log('inside handleSignIn')
      const { email, password } = this.state

      // Ensuring no fields are empty.
      if(email == '' || password == '')
      {
        alert('Please fill all the fields.');
        return;
      }
      this.props.loginUser({email, password})
      this.props.navigation.navigate('MainStack')
    }

    handleLoading = () => {
      if(this.props.loading){
        return <ActivityIndicator />;
      } else {
        return <Text style={styles.text}> Login </Text>;
      }
    }

  // Toggle eye icon to show/hide password.
  showPass = () => {
      if (this.state.showPass == true) {
        this.setState({ showPass: false})
      } else {
        this.setState({ showPass: true})
      }
    }


render() {
    return (
      <ImageBackground source={bgImage} style={styles.backgroundContainer}>
      <View>
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.logoText}> Know what's happening on campus </Text>
        </View>
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 5 }}>
            {this.props.error}
          </Text>

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

        <TouchableOpacity style={styles.btnLogin} onPress={this.loginUser}>
          {this.handleLoading()}
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLogin} onPress={() => this.props.navigation.navigate('Login')}>
          <Text style={styles.text}> Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.clickableText} onPress={() => this.props.navigation.navigate('SignUp')} >
          New user? Signup
        </Text>


      </View>
      </ImageBackground>
    )
  }
}
const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    width: null,
    height: null,
    justifyContent: 'center',
    alignItems: 'center'
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
    height: 47,
    width: 160
  },
  logoText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '200',
    marginTop: 10,
    opacity: 0.5
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
    backgroundColor: '#4b5581',
    justifyContent: 'center',
    marginTop: 20
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8
  },
  backHomeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16
  }
})


const mapStateToProps = state => {
  /* only return the property that we care about */
  return{
    error: state.auth.error,
    success: state.auth.success,
    loading: state.auth.loading
  };
};

export default connect(mapStateToProps, {loginUser}) (EmailLogin);
