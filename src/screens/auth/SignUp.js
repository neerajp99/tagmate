// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import { StyleSheet, Text, TextInput, View, Button } from 'react-native';
import {connect} from 'react-redux';
import {signupUser} from '../../actions';

class SignUp extends Component {
  state = { email: '', password: '' }

  handleSignUp = () => {
      const { email, password } = this.state;
      this.props.signupUser({email, password});
    }

render() {
    return (
      <View style={styles.container}>
        <Text>Sign Up</Text>
          <Text style={{ color: 'red' }}>
            {this.props.error}
          </Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button title="Sign Up" onPress={this.handleSignUp} />
        <Button
          title="Already have an account? Login"
          onPress={() => this.props.navigation.navigate('Login')}
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

export default connect(mapStateToProps, {signupUser}) (SignUp);
