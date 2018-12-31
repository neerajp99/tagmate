// Login.js
import React, {Component} from 'react'
import firebase from 'react-native-firebase';
import {connect} from 'react-redux';
import {loginUser} from '../../actions';
import { StyleSheet, Text, TextInput, View, Button, Image, ImageBackground, Dimensions, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import bgImage from '../../img/background.jpg'
import logo from '../../img/logo.png'

const { width: WIDTH } = Dimensions.get('window')

class Login extends Component {
  state = { email: '', password: '', showPass: true, passPress: false}


  handleLogin = () => {
    const { email, password } = this.state;
    this.props.loginUser({email, password});
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
      <ImageBackground source={bgImage} style={styles.backgroundContainer}>
      <View>
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.logoText}> Do more for others. Get more done. </Text>
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

        <TouchableOpacity style={styles.btnLogin} onPress={this.handleLogin}>
          <Text style={styles.text}> Login </Text>
        </TouchableOpacity>
        <Text style={styles.clickableText} onPress={() => this.props.navigation.navigate('SignUp')} >
          New to Adour? Sign Up
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
    width: 150
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
    backgroundColor: '#432577',
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
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8
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
