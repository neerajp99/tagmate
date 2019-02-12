import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking, Alert} from 'react-native';
import {markRequestDone, markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, Card, ListItem, Text, Divider } from 'react-native-elements';
import * as _ from 'lodash';
import {getAllServices, getWhatsapp} from '../lib/firebaseUtils.js';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_TWO} from './style/AdourStyle'

class DashboardDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disabledDone:false, // "Mark as Done" is not disabled
      fetching:true,
      item:{id:this.props.navigation.state.params.taskId, 'whatsapp':'Loading...'}, // Loading service request's ID which was passed on
      hide:false,
      whatsappAvailable:false, // Whatsapp number is not yet loaded
    }
    this.liveUpdates = this.liveUpdates.bind(this);
  }

  componentDidMount(){
    this._isMounted = true;
    getAllServices().then(services => // Get list of all services, then:
    {
      this.setState({services}); // Make services list available to the screen
      this.liveUpdates(); // Get live updates for the service request {this.state.item.id}
    });
  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  liveUpdates = () => {

    const {currentUser: {uid} = {}} = firebase.auth()

    // Listen for changes in service request {this.state.item.id}
    firebase.database().ref(`/servicesRequests/${this.state.item.id}`).on("value", function(snapshot)
    {
      if(this._isMounted)
      {
        var item = snapshot.val();
        this.setState({fetching:false});
        if(item.clientId == uid) item.isClient = true; // The user is requester
        else if(item.serverId == uid) item.isClient = false; // The user is acceptor
        else
        {
          // The user is neither requester nor acceptor
          this.setState({hide:true});
          return;
        }
        item.serviceTitle = '';
        // Fetching service's title:
        this.state.services.map(service =>
        {
          if(item.serviceId == service.id) item.serviceTitle = service.title;
        })
        item.whatsapp = this.state.item.whatsapp;
        this.setState({item:item});
        // If whatsapp number is not available yet:
        if(!this.state.whatsappAvailable)
        {
          // Get whatsapp number of the other person involved in this service request:
          getWhatsapp((item.isClient)?item.serverId:item.clientId).then(whatsapp=>
          {
            // Then, update the whatsapp number:
            item.whatsapp = whatsapp;
            this.setState({item:item, whatsappAvailable:true});
          });
        }
      }
    }.bind(this));

  }

  loadPhone = () =>
  {
      Linking.openURL('tel://+91'+this.state.item.whatsapp)
  }

  // Expects a valid mobile number in this.state.item.whatsapp
  // Changes nothing, opens Whatsapp.
  loadWhatsapp = () =>
  {
    if(this.state.whatsappAvailable)
    {
      if(this.state.item.isClient)
      {
        Linking.openURL('whatsapp://send?text=Hey, thanks for accepting my Adour request for '+ this.state.item.serviceTitle +'.&phone=+91'+this.state.item.whatsapp)
      } else {
        Linking.openURL('whatsapp://send?text=Hey, I accepted your Adour request for '+ this.state.item.serviceTitle +'.&phone=+91'+this.state.item.whatsapp)
      }

    }
  }

  // Expects {id} parameter to be a valid service request ID
  // Changes service request's status to 2 (Complete) in Firebase realtime database
  markDone = (id) => {
    if(this.state.disabledDone == true) return;
    else // Only if the button is not disabled:
    {
      this.setState({disabledDone:true});
      markRequestDone(id).then(resp=>{this.props.navigation.navigate('DashboardScreen')})
    }
  }

  confirmCancel = (item) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to cancel this task? Frequent cancellations may affect your Adour reputation.',
      [
        {text: 'No', onPress: () => console.log('Cancellation Revoked')},
        {text: 'Yes', onPress: () => this.markCancelled(item)}
      ]
    );
  }
  // Expects {item} parameter to be an object with two valid properties: id (of service request) and isClient
  // Changes service request's status to cancelled in Firebase realtime database
  markCancelled = (item) => {
    markRequestCancelled(item.id, item.isClient).then(resp =>
    {
      this.props.navigation.navigate('DashboardScreen')
    })
  }

  render()
  {
    const {item} = this.state;
    console.log(item);
    var statusStr = 'Not available';
    if(typeof item.status != 'undefined')
    {
      switch(item.status)
      {
        case 0: statusStr = 'Looking for your savior'; break;
        case 1: statusStr = (item.isClient)?'Waiting for savior to complete task':'Waiting for you to complete task'; break;
        case 2: statusStr = 'Completed'; break;
        case 3: statusStr = (item.isClient)?'Cancelled by you':'Cancelled by requester'; break;
        case 4: statusStr = (item.isClient)?'Cancelled by your (ex)savior':'Cancelled by you';break;
      }
    }
    return (
      <View style={styles.mainContainer}>
      <Card title={item.serviceTitle} titleStyle={adourStyle.cardTitle}>
          {/* Task Status */ }
          <View style={styles.cardSubtitle}>
          <Text style={adourStyle.cardSubtitle}>{statusStr}</Text>
          </View>

        <Divider />
          {/* Task Timing and details */ }
          <ListItem
              title={ "Scheduled for: "+ (item.when) }
              subtitleStyle={adourStyle.listItemText}
              titleStyle={adourStyle.listItemText}
              hideChevron={true}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              leftIcon={{ name: 'access-time'}}
            />

          {
            item.details != "" &&
                <ListItem
                    title={item.details}
                    titleStyle={adourStyle.listItemText}
                    hideChevron={true}
                    containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                    leftIcon={{ name: 'info-outline'}}
                  />
          }

          {/* Timestamp DISABLED - throwing error
          <View style={styles.subContent} key={item.id}>
          <ListItem
              title={['Posted ', <TimeAgo key={item.id} time={item.created_at} />]}
              titleStyle={adourStyle.listItemText}
              hideChevron={true}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              leftIcon={{ name: 'access-time'}}
            />
          </View>

           */ }

            {/* Contact Number */ }
          {
            //Do not show phone number if status is looking for savior or task is cancelled
            item.status != 0 && item.status != 3 && item.status != 4 &&
            <View style={styles.subContent}>
            <ListItem
                title={item.whatsapp}
                titleStyle={adourStyle.listItemText}
                hideChevron={true}
                onPress={()=>{this.loadPhone()}}
                containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                leftIcon={{ name: 'contact-phone'}}
              />
            </View>
          }
            {/* Whatsapp Chat button */ }
          <View style={styles.subContent}>
          {
            //Do not show Whatsapp button if status is looking for savior or task is cancelled
            item.status != 0 && item.status != 3 && item.status != 4 &&
            <Button
              icon={{name: 'chat'}}
              disabled={!this.state.whatsappAvailable}
              onPress={()=>{this.loadWhatsapp()}}
              buttonStyle={adourStyle.btnGeneral}
              textStyle={adourStyle.btnText}
              title={(this.state.whatsappAvailable)?'Chat on Whatsapp':'Loading Whatsapp...'} />
          }
          {
            item.isClient && item.status == 1 &&
                  <Button onPress={()=>this.markDone(item.id)}
                      buttonStyle={adourStyle.btnGeneral}
                      textStyle={adourStyle.btnText}
                      disabled={this.state.disabledDone}
                      title="Mark as Done"
                  />
          }
          {
           item.status < 2 &&
                <Button
                    onPress={()=>this.confirmCancel(item)}
                    buttonStyle={adourStyle.btnCancel}
                    textStyle={adourStyle.btnText}
                    title="Cancel"
                />
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
