import React, {Component} from 'react';
import {View, Text} from 'react-native';

class ChatScreen extends Component{
  render(){
  	var txt = "Chat Screen";
    // A quick fix to see if a whatsapp number was passed onto this screen.
    if(typeof this.props.navigation != "undefined" &&
    	typeof this.props.navigation.state != "undefined" &&
    	typeof this.props.navigation.state.params != "undefined" &&
    	typeof this.props.navigation.state.params.whatsapp != "undefined")
    	txt = "The mobile number is "+this.props.navigation.state.params.whatsapp;
    return(
      <View>
        <Text>{ txt }</Text>
      </View>
    )
  }
}

export {ChatScreen};
