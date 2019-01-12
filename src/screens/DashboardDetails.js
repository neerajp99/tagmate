import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking} from 'react-native';
import {markRequestDone, markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, Card, ListItem, Text, Divider } from 'react-native-elements';
import * as _ from 'lodash';


class DashboardDetails extends Component {
  state =
  {
    disabledDone:false,
  }
  markDone = (id) => {
    if(this.state.disabledDone == true) return;
    else
    {
      this.setState({disabledDone:true});
      markRequestDone(id).then(resp =>
      {
        this.setState({disabledDone:false});
        this.props.navigation.navigate('DashboardScreen')
      })
    }
  }

  markCancelled = (id) => {
    markRequestCancelled(id).then(resp =>
    {
      this.props.navigation.navigate('DashboardScreen')
    })
  }

  render()
  {
    const {item} = this.props.navigation.state.params
    console.log(item);
    var statusStr = 'Not available';
    if(typeof item.status != 'undefined')
    {
      switch(item.status)
      {
        case 0: statusStr = 'Looking for your savior'; break;
        case 1: statusStr = (item.isClient)?'Waiting for your savior to complete the task':'Waiting for you to complete the task'; break;
        case 2: statusStr = 'Completed'; break;
        case 3: statusStr = 'Cancelled'; break;
      }
    }
    return (
      <View style={styles.mainContainer}>
      <Card title={item.serviceId} titleStyle={styles.cardTitleStyle}>
          {/* Task Status */ }
          <View style={styles.cardSubtitle}>
          <Text style={styles.cardSubtitleText}>{statusStr}</Text>
          </View>

        <Divider />
          {/* Task Timing and details */ }
          <ListItem
              title={item.when}
              hideChevron={true}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              leftIcon={{ name: 'access-time'}}
            />
          {
            item.details != "" &&
                <ListItem
                    title={item.details}
                    hideChevron={true}
                    containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                    leftIcon={{ name: 'info-outline'}}
                  />
          }


            {/* Contact Number */ }
          <View style={styles.subContent}>
          <ListItem
              title={item.whatsapp}
              hideChevron={true}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              leftIcon={{ name: 'contact-phone'}}
            />
          </View>
            {/* Whatsapp Chat button */ }
          <View style={styles.subContent}>
          <Button
            icon={{name: 'chat'}}
            backgroundColor='#21c627'
            onPress={()=>{
            Linking.openURL('whatsapp://send?text=Hey, I accepted your Adour request.&phone=+91'+item.whatsapp)
          }} title="Chat on Whatsapp" />
          {
            item.isClient && item.status == 1 && <Button onPress={()=>this.markDone(item.id)} disabled={this.state.disabledDone} title="Mark as Done" />
          }
          {
           item.status < 2 && <Button onPress={()=>this.markCancelled(item.id)} title="Cancel Request" />
          }
          </View>
        </Card>
      </View>
    )
  }
}

export {DashboardDetails};

/*
* Styles used in this screen
* */
const styles = StyleSheet.create({
    container: {
      position:'relative',
      top:0,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitleStyle: {
      fontSize:20,
      marginLeft: 18,
      textAlign:'left',
    },
    subContent: {
      marginTop: 2,
      marginBottom: 10
    },
    cardSubtitle: {
      marginBottom: 16,
      marginLeft: 18
    },
    cardSubtitleText: {
      fontSize: 16,
      fontWeight: '100'
    },
    buttonContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    mainContainer: {
        flex: 1
    },
    progressContainer: {
        width: 60,
        height: 60,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -30,
        marginTop: -30
    },
    rowItem: {
        alignSelf: 'stretch',
        justifyContent: 'flex-end',
        borderBottomColor: '#5d5d5d',
        borderBottomWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    listContainer: {
        flex: 1,
    },
    textTitle: {
      fontSize: 18,
      fontWeight: '200',
      marginBottom: 5,
    },
    textDescription: {
      fontSize: 16,
      fontWeight: '100',
      marginLeft:5
    },
    contentContainer: {
        width: '100%'
    }
})
