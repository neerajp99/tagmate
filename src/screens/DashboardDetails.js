import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking, Alert, ScrollView} from 'react-native';
import {markRequestDone, markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, Card, ListItem, Text, Divider, Badge, withBadge } from 'react-native-elements';
import * as _ from 'lodash';
import {getAllServices, getWhatsapp, getName, getCoins, hasOptedOutAsGuest} from '../lib/firebaseUtils.js';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_TWO} from './style/AdourStyle'

const CUSTOM_IMG = "http://chillmateapp.com/assets/item_img/custom.jpg";

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
      itemService: [],
      optedOut: false,
      serviceTitle: '',
      unreadChatCount: 0,
      serviceImg: 'http://chillmateapp.com/assets/item_img/custom.jpg',
      whatsappAvailable:false, // Whatsapp number is not yet loaded
    }
    this.liveUpdates = this.liveUpdates.bind(this);
  }

  componentDidMount(){
    this._isMounted = true;
    getAllServices().then(services => // Get list of all services, then:
    {
      this.setState({services}); // Make services list available to the screen
      this.getTaskItem();
      this.liveUpdates(); // Get live updates for the service request {this.state.item.id}
    });

    //this.getServiceItem();
  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  //WIP
  getTaskItem = () => {
    var ref = firebase.database().ref(`servicesRequests/${this.state.item.id}`);
    ref.on('value', (snapshot) => {
      let data = snapshot.val();
      this.setState({ item: data});

      if(this.state.item.status != 0){
        this.getConfirmedGuests();
        this.getUnreadChatCount();
      }
      // Fetching service's title:
      if(!this.state.item.custom){
        //this is not a custom activity, match the serviceId of the post with the service Id of the global list of services
        //then fetch the image and title from the global service object
        this.state.services.map(service =>
          {
          if(this.state.item.serviceId == service.id){
            this.setState({serviceTitle: service.title});
            this.setState({serviceImg: service.img});
            }
          })
      } else {
        //this is a custom activity, get the title from post object, get image from the hard coded constant
        this.setState({serviceTitle: this.state.item.customTitle, serviceImg: CUSTOM_IMG});
      }
    })

    const {currentUser: {uid} = {}} = firebase.auth()

    //Check if the current user is a guest and has recently opted out
    hasOptedOutAsGuest(uid, this.state.item.id).then(result =>{
    if(result != null){
      console.log('hasOptedOutAsGuest result is ', result);
      this.setState({optedOut: result})
      }
    })


  }

  getServiceItem = () => {
    var ref = firebase.database().ref(`services`);
    ref.on('value', (snapshot) => {
      let data = snapshot.val();
      this.setState({ services: data});
      console.log('inside getServiceItem');
    })
  }

  getUnreadChatCount = () =>
  {
    const {currentUser: {uid} = {}} = firebase.auth()
    firebase.database().ref(`/users/${uid}/messages/${this.state.item.id}/unreadCount`).on("value", function(snapshot)
    {
      if(this._isMounted) this.setState({unreadChatCount: snapshot.val() || "0"});
    }.bind(this));
  }


  //Returns the react native component list with names of confirmed guests
  getConfirmedGuests = () => {
      var ref = firebase.database().ref(`servicesRequests/${this.state.item.id}/confirmedGuests`);
      console.log('inside getConfirmedGuests');
      ref.on('value', (snapshot) => {
        let data = snapshot.val();
        let guestItems = Object.values(data);
        this.setState({ confirmedGuestList: guestItems});
    })
  }

  liveUpdates = () => {

    const {currentUser: {uid} = {}} = firebase.auth()
    console.log('liveUpdates func')
    // Listen for changes in service request {this.state.item.id}
    firebase.database().ref(`/servicesRequests/${this.state.item.id}`).on("value", function(snapshot)
    {
      console.log('liveUpdates step 2')
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

        if(!item.custom)
        {
          //get services object
          firebase.database().ref(`/services/${this.state.item.serviceId}`).on('value', (snapshot) => {
            let serviceData = snapshot.val();
            let serviceItem = Object.values(serviceData);
            this.setState({ itemService: serviceItem});
          })
          // Fetching service's title:
          this.state.services.map(service =>
          {
            if(item.serviceId == service.id){
              item.serviceTitle = service.title;
              item.serviceImg = service.img;
            }
          })
        } else {
          //this is a custom post, get title from the post object instead of fetching it from the global service object
          item.serviceTitle = item.customTitle;
          item.serviceImg = CUSTOM_IMG;
        }

        this.setState({item:item});

        // Get name of the user involved in this service request:
        getName(uid).then(selfName=>
        {
          // Then, update the name:
          item.selfName = selfName;
          this.setState({item:item});
        });

        //If guest list is finalized, check if there are unread chat msgs
        if(item.status != 0) this.getUnreadChatCount();

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

        //Check if the current user is a guest and has recently opted out
        hasOptedOutAsGuest(uid, this.state.item.id).then(result =>{
        if(result != null){
          console.log('hasOptedOutAsGuest result is ', result);
          this.setState({optedOut: result})
          }
        })

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

  openChat = (item) =>
  {
    //create an array of all users involved so that we can increment their unread message count later
    let usersInvolved = [];
    this.state.confirmedGuestList.map(guest =>
      {
        usersInvolved.push(guest.id);
      })
    usersInvolved.push(item.clientId);
    console.log('usersInvolved', usersInvolved);

    this.props.navigation.navigate("Chat", {
      name: item.selfName,
      taskId: item.id,
      userList: usersInvolved,
    })
  }

  confirmCancel = (item) => {
    if(item.status ==1)
    {
      Alert.alert(
      'Confirmation',
      'Are you sure you want to opt out of this activity?',
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
      console.log('cancelled');
      if(!item.isClient){
        this.setState({optedOut: true});
      }
      //Do nothing
      //this.props.navigation.navigate('DashboardScreen')
    });
  }

  renderGuests = ({item}) => {
      const {id, fullName, guestStatus} = item;

      return (
        <View>
        {guestStatus != 3 && <ListItem
          title={fullName}
          titleStyle={adourStyle.listItemText}
          chevron={false}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftIcon={{ name: 'person'}}
        />}
        {guestStatus == 3 && <ListItem
          title={fullName + " has left"}
          titleStyle={adourStyle.greyText}
          chevron={false}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftIcon={{ name: 'person'}}
        />}
        </View>
      )
  }

  render()
  {
    const {item, confirmedGuestList, itemService, serviceTitle, serviceImg, unreadChatCount, optedOut} = this.state;
    var statusStr = 'Not available';
    let host = 'Anonymous';
    if(!item.anonymous) host = item.hostName;
    if(typeof item.status != 'undefined')
    {
      switch(item.status)
      {
        case 0: statusStr = 'Looking for Chillmates'; break;
        case 1: statusStr = (item.isClient)?'Upcoming activity':'Upcoming activity'; break;
        case 2: statusStr = 'Completed'; break;
        case 3: statusStr = (item.isClient)?'Cancelled by you':'Cancelled by the host'; break;
        case 4: statusStr = (item.isClient)?'Cancelled by your Chillmate':'Cancelled by you';break; //case 4 is useless now
      }
    }
    return (
      <ScrollView>
      <View style={styles.mainContainer}>
      <Card featuredTitle={serviceTitle} featuredTitleStyle={adourStyle.listItemText} image={{uri: serviceImg}}>
          <ListItem
              title={host}
              titleStyle={adourStyle.listItemText}
              subtitle="Host"
              subtitleStyle={adourStyle.listItemText}
              rightTitle={statusStr}
              rightTitleStyle={adourStyle.listItemText}
              chevron={false}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
            />
                  {/* Task Timing and details */ }
                  {
                    item.when != "" &&
                        <ListItem
                          title={"Scheduled for: "+(item.when) }
                          subtitleStyle={adourStyle.listItemText}
                          titleStyle={adourStyle.listItemText}
                          chevron={false}
                          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                          leftIcon={{ name: 'access-time'}}
                        />
                  }

                  {
                    item.details != "" &&
                        <ListItem
                            title={item.details}
                            titleStyle={adourStyle.listItemText}
                            chevron={false}
                            containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                            leftIcon={{ name: 'info-outline'}}
                          />
                  }

                  {/* Timestamp DISABLED - throwing error
                  <View style={styles.subContent} key={item.id}>
                  <ListItem
                      title={['Posted ', <TimeAgo key={item.id} time={item.created_at} />]}
                      titleStyle={adourStyle.listItemText}
                      chevron={false}
                      containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                      leftIcon={{ name: 'access-time'}}
                    />
                  </View>

                   */ }

      </Card>


      {item.status == 1 && <Card title="Guest List" titleStyle={adourStyle.cardTitle}>
        <FlatList
            data={confirmedGuestList}
            extraData={confirmedGuestList}
            renderItem={this.renderGuests}
            keyExtractor={(confirmedGuestList, index) => confirmedGuestList.id}
        />
        {
          item.status == 1 && !optedOut &&
          <View>
          <Button
          icon={{name: 'chat'}}
          onPress={() => this.openChat(item)}
          buttonStyle={adourStyle.btnGeneral}
          titleStyle={adourStyle.btnText}
          title="Chat" />
          {(unreadChatCount != 0) && <Badge value={unreadChatCount} status="success" containerStyle={{ position: 'absolute', top: 14, right: 0 }} />}
          </View>
        }
      </Card>}

      <Card>

           {
             item.isClient && item.status == 0 &&
                  <View>
                   <Button onPress={()=>this.openGuestList(item.id)}
                       buttonStyle={adourStyle.btnGeneral}
                       titleStyle={adourStyle.btnText}
                       disabled={this.state.disabledDone}
                       title="Guest List"
                       rightIcon={{name: 'code'}}
                   />
                   {(item.interestedCount != 0) && <Badge value={item.interestedCount} status="primary" containerStyle={{ position: 'absolute', top: 14, right: 0 }} />}
                   </View>

           }

          {
            item.isClient && item.status == 1 &&
                  <Button onPress={()=>this.markDone(item.id)}
                      buttonStyle={adourStyle.btnGeneral}
                      titleStyle={adourStyle.btnText}
                      disabled={this.state.disabledDone}
                      title="Mark as Done"
                  />
          }

          {
           item.status < 2 && !optedOut &&
                <Button
                    onPress={()=>this.confirmCancel(item)}
                    buttonStyle={adourStyle.btnCancel}
                    titleStyle={adourStyle.btnText}
                    title={(item.isClient)?"Remove":"Opt Out"}
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
      marginBottom: 10,
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
