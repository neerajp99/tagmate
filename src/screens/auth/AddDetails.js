// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import { StyleSheet, Text, TextInput, View, Button } from 'react-native';
import {CheckBox} from 'react-native-elements';
import {connect} from 'react-redux';
import {submitUserServices} from '../../actions';

class AddDetails extends Component {
  state = { delhi: false, cig: false, rollingpaper: false, laundry: false}

  onButtonPress(){
    const {delhi, cig, rollingpaper, laundry} = this.state;

    this.props.submitUserServices({delhi, cig, rollingpaper, laundry});

  }

render() {
    return (
      <View>
        <Text>What can you offer?</Text>
        {/* TODO: Turn CheckBox into a resusable component. Use a loop to iterate and render. */}
        <CheckBox
          title='Get something from Delhi'
          checked={this.state.delhi}
          onPress={() => this.setState({delhi: !this.state.delhi})}
          />
        <CheckBox
          title='Submit/Collect Laundry'
          checked={this.state.laundry}
          onPress={() => this.setState({laundry: !this.state.laundry})}
          />
        <CheckBox
          title='Cigarettes'
          checked={this.state.cig}
          onPress={() => this.setState({cig: !this.state.cig})}
          />
        <CheckBox
          title='Rolling papers'
          checked={this.state.rollingpaper}
          onPress={() => this.setState({rollingpaper: !this.state.rollingpaper})}
          />
        <Button title="Done" onPress={this.onButtonPress.bind(this)} />
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

export default connect(mapStateToProps, {submitUserServices}) (AddDetails);
