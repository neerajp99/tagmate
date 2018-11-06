// Login.js
import React, {Component} from 'react'
import firebase from 'react-native-firebase';
import {connect} from 'react-redux';
import {loginUser} from '../../actions';
import { StyleSheet, Text, TextInput, View, Button } from 'react-native'


class Login extends Component {
  state = { email: '', password: '' }

  handleLogin = () => {
    const { email, password } = this.state;
    this.props.loginUser({email, password});
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Login</Text>
          <Text style={{ color: 'red' }}>
            {this.props.error}
          </Text>
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          secureTextEntry
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Password"
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button title="Login" onPress={this.handleLogin} />
        <Button
          title="Don't have an account? Sign Up"
          onPress={() => this.props.navigation.navigate('SignUp')}
        />
      </View>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textInput: {
    height: 40,
    width: '90%',
    borderColor: 'gray',
    borderWidth: 1,
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
