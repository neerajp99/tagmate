import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking, Alert, ScrollView} from 'react-native';
import {markRequestDone, markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, Card, ListItem, Text, Divider } from 'react-native-elements';
import * as _ from 'lodash';
import {getAllServices, getWhatsapp, getName, getCoins} from '../lib/firebaseUtils.js';
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
      nameAvailable:false,
      confirmedGuestList: [],
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
    this.getConfirmedGuests();
  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  //Returns the react native component list with names of confirmed guests
  getConfirmedGuests = () => {
      var ref = firebase.database().ref(`servicesRequests/${this.state.item.id}/confirmedGuests`);
      console.log('inside getConfirmedGuests');
      ref.on('value', (snapshot) => {
      console.log('snapshot.val(): ', snapshot.val());
      let data = snapshot.val();
      let guestItems = Object.values(data);
      this.setState({ confirmedGuestList: guestItems});
      console.log('confirmedGuestList state: ', this.state.confirmedGuestList);
    })
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
          if(item.serviceId == service.id){
            item.serviceTitle = service.title;
            item.serviceImg = service.img;
          }
        })

        item.whatsapp = this.state.item.whatsapp;
        this.setState({item:item});

        // Get name of the user involved in this service request:
        getName(uid).then(selfName=>
        {
          // Then, update the name:
          item.selfName = selfName;
          this.setState({item:item});
        });

        // If name is not available yet:
        if(!this.state.nameAvailable)
        {
          // Get name of the other person involved in this service request:
          getName((item.isClient)?item.serverId:item.clientId).then(name=>
          {
            // Then, update the name:
            item.name = name;
            this.setState({item:item, nameAvailable:true});
          });
        }


        // Get reputation coins of the other person involved in this service request:
        getCoins((item.isClient)?item.serverId:item.clientId).then(coins=>
        {
          // Then, update the coins:
          item.coins = coins;
          this.setState({item:item});
        });


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


  // Expects {id} parameter to be a valid service request ID
  // Changes service request's status to 2 (Complete) in Firebase realtime database
  markDone = (id) => {
    if(this.state.disabledDone == true) return;
    else // Only if the button is not disabled:
    {
      this.setState({disabledDone:true});
      markRequestDone(id).then(resp=>{
        alert('Your reputation points increased!')
        this.props.navigation.navigate('DashboardScreen')
      })
    }
  }

  // Open Guest List Page: this page has the list of everyone who is interested in this activity
  openGuestList = (itemId) =>
  {
    this.props.navigation.navigate('GuestList',{taskId: itemId})
  }

  confirmCancel = (item) => {
    if(item.status ==1)
    {
      Alert.alert(
      'Confirmation',
      'Are you sure you want to unmatch?',
      [
        {text: 'No', onPress: () => console.log('Cancellation Revoked')},
        {text: 'Yes', onPress: () => this.markCancelled(item)}
      ]
    );
  } else {
    Alert.alert(
    'Confirmation',
    'Are you sure you want to remove this activity? You cannot undo this action.',
    [
      {text: 'No', onPress: () => console.log('Cancellation Revoked')},
      {text: 'Yes', onPress: () => this.markCancelled(item)}
    ]
  );
  }

  }
  // Expects {item} parameter to be an object with two valid properties: id (of service request) and isClient
  // Changes service request's status to cancelled in Firebase realtime database
  markCancelled = (item) => {
    const {currentUser: {uid} = {}} = firebase.auth()

    markRequestCancelled(uid, item.id, item.isClient).then(resp =>
    {
      this.props.navigation.navigate('DashboardScreen')
    });
  }

  renderGuests = ({item}) => {
      const {id, fullName} = item;

      return (
        <View>
        <ListItem
          title={fullName}
          titleStyle={adourStyle.listItemText}
          hideChevron={true}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
          leftIcon={{ name: 'access-time'}}
        />
        </View>
      )
  }

  render()
  {
    const {item, confirmedGuestList} = this.state;
    console.log(item);
    var statusStr = 'Not available';
    if(typeof item.status != 'undefined')
    {
      switch(item.status)
      {
        case 0: statusStr = 'Looking for a Chillmate'; break;
        case 1: statusStr = (item.isClient)?'Upcoming activity':'Upcoming activity'; break;
        case 2: statusStr = 'Completed'; break;
        case 3: statusStr = (item.isClient)?'Cancelled by you':'Cancelled by requester'; break;
        case 4: statusStr = (item.isClient)?'Cancelled by your Chillmate':'Cancelled by you';break;
      }
    }
    return (
      <ScrollView>
      <View style={styles.mainContainer}>
      <Card title={item.serviceTitle} titleStyle={adourStyle.cardTitle} image={{uri: item.serviceImg}}>
          {/* Task Status */ }
          <View style={styles.cardSubtitle}>
          <Text style={adourStyle.cardSubtitle}>{statusStr}</Text>
          </View>


        <Divider />
        <Text style={adourStyle.cardSubtitle}>Guest List</Text>
        <FlatList
            data={confirmedGuestList}
            extraData={confirmedGuestList}
            renderItem={this.renderGuests}
            keyExtractor={(confirmedGuestList, index) => confirmedGuestList.id}
        />

          {/* Task Timing and details */ }
          {
            item.when != "" &&
                <ListItem
                  title={"Scheduled for: "+(item.when) }
                  subtitleStyle={adourStyle.listItemText}
                  titleStyle={adourStyle.listItemText}
                  hideChevron={true}
                  containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                  leftIcon={{ name: 'access-time'}}
                />
          }

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

           {
             item.status == 1 &&
             <Button
             icon={{name: 'chat'}}
             onPress={() =>
                       this.props.navigation.navigate("Chat", {
                         name: item.selfName,
                         taskId: item.id
                       })}
             buttonStyle={adourStyle.btnGeneral}
             textStyle={adourStyle.btnText}
             title="Chat" />
           }

           {
             item.isClient && item.status == 0 &&
                   <Button onPress={()=>this.openGuestList(item.id)}
                       buttonStyle={adourStyle.btnGeneral}
                       textStyle={adourStyle.btnText}
                       disabled={this.state.disabledDone}
                       title="Guest List"
                   />
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
                    title={(item.status == 1)?"Unmatch":"Remove"}
                />
          }
        </Card>
      </View>
      </ScrollView>
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
