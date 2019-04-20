import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import {Card, Button} from 'react-native-elements';
import {adourStyle} from './style/AdourStyle'

const { width: WIDTH } = Dimensions.get('window')

class SupportScreen extends Component{

  launchEmail = () =>
  {
      Linking.openURL('mailto:support@chillmateapp.com?subject=Chillmate Customer Support&body=Please type your feedback/question below: ')
  }

  launchPhone = () =>
  {
      Linking.openURL('tel://+919053338020')
  }

  render(){
    return(
      <Card>
        <View style={{marginLeft:10, marginRight:8, marginBottom: 10}}>
          <Text style={adourStyle.listItemTextBold}>
            Have a question / concern or just want to share feedback? You can contact us using the following options:
          </Text>
        </View>
        <Button onPress={()=>this.launchPhone()}
            buttonStyle={adourStyle.btnGeneral}
            titleStyle={adourStyle.btnText}
            title="Phone"
        />
        <Button onPress={()=>this.launchEmail()}
            buttonStyle={adourStyle.btnGeneral}
            titleStyle={adourStyle.btnText}
            title="Email"
        />
      </Card>
    )
  }
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8
  },

})


export {SupportScreen};
