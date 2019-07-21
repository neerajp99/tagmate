import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking, Alert, ScrollView} from 'react-native';
import {markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialComIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, ListItem, Text, Divider, Badge, withBadge } from 'react-native-elements';
import * as _ from 'lodash';
import {getNetworkId, getWhatsapp, getName, getCoins, hasOptedOutAsGuest} from '../lib/firebaseUtils.js';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_TWO} from './style/AdourStyle'
import OfflineNotice from './OfflineNotice';

const CUSTOM_IMG = "http://instajude.com/assets/item_img/custom.jpg";
let uid;

class DashboardDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disabledDone:false, // "Mark as Done" is not disabled
      fetching:true,
      item:{id:this.props.navigation.state.params.taskId, when: 'Loading...' ,'whatsapp':'Loading...'}, // Loading service request's ID which was passed on
      hide:false,
      nameAvailable:false,
      confirmedGuestList: [],
      optedOut: false,
      unreadChatCount: 0,
      whatsappAvailable:false, // Whatsapp number is not yet loaded
    }
    this.liveUpdates = this.liveUpdates.bind(this);
  }

  componentDidMount(){
    this._isMounted = true;
    let user = firebase.auth().currentUser;
    if (user != null) {
      uid = user.uid;
    }

    getNetworkId(uid).then(networkId => {
      if(this._isMounted) this.setState({networkId});
      this.getTaskItem();
      this.liveUpdates(); // Get live updates for the service request {this.state.item.id}
    })
  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  //WIP
  getTaskItem = () => {
    let networkId = this.state.networkId;
    var ref = firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}`);
    ref.on('value', (snapshot) => {
      let data = snapshot.val();
      if(this._isMounted) this.setState({ item: data});

      if(this.state.item.status != 0 && this.state.item.status != 3){
        this.getConfirmedGuests();
        this.getUnreadChatCount();
      }

    })

    //Check if the current user is a guest and has recently opted out
    hasOptedOutAsGuest(uid, this.state.item.id).then(result =>{
    if(result != null){
      console.log('hasOptedOutAsGuest result is ', result);
      if(this._isMounted) this.setState({optedOut: result})
      }
    })


  }

  getUnreadChatCount = () =>
  {
    firebase.database().ref(`/users/${uid}/messages/${this.state.item.id}/unreadCount`).on("value", function(snapshot)
    {
      if(this._isMounted) this.setState({unreadChatCount: snapshot.val() || "0"});
    }.bind(this));
  }


  //Returns the react native component list with names of confirmed guests
  getConfirmedGuests = () => {
      let networkId = this.state.networkId;
      let ref = firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}/confirmedGuests`);
      console.log('inside getConfirmedGuests');
      if(this._isMounted){
        ref.on('value', (snapshot) => {
          let data = snapshot.val();
          let guestItems = Object.values(data);
          if(this._isMounted) this.setState({ confirmedGuestList: guestItems});
        })
      }

  }

  liveUpdates = () => {

    console.log('liveUpdates func')
    // Listen for changes in service request {this.state.item.id}
    let networkId = this.state.networkId;
    firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}`).on("value", function(snapshot)
    {
      console.log('liveUpdates step 2')
      if(this._isMounted)
      {
        var item = snapshot.val();
        if(this._isMounted) this.setState({fetching:false});
        if(item.hostId == uid) item.isClient = true; // The user is requester
        else if(item.serverId == uid) item.isClient = false; // The user is acceptor
        else
        {
          // The user is neither requester nor acceptor
          if(this._isMounted) this.setState({hide:true});
          return;
        }

        if(this._isMounted) this.setState({item:item});

        // Get name of the user involved in this service request:
        getName(uid).then(selfName=>
        {
          // Then, update the name:
          item.selfName = selfName;
          if(this._isMounted) this.setState({item:item});
        });

        //If guest list is finalized, check if there are unread chat msgs
        if(item.status != 0) this.getUnreadChatCount();

        // If name is not available yet:
        if(!this.state.nameAvailable)
        {
          // Get name of the other person involved in this service request:
          getName((item.isClient)?item.serverId:item.hostId).then(name=>
          {
            // Then, update the name:
            item.name = name;
            if(this._isMounted) this.setState({item:item, nameAvailable:true});
          });
        }

        //Check if the current user is a guest and has recently opted out
        hasOptedOutAsGuest(uid, this.state.item.id).then(result =>{
        if(result != null){
          console.log('hasOptedOutAsGuest result is ', result);
          if(this._isMounted) this.setState({optedOut: result})
          }
        })

        // Get reputation coins of the other person involved in this service request:
        getCoins((item.isClient)?item.serverId:item.hostId).then(coins=>
        {
          // Then, update the coins:
          item.coins = coins;
          if(this._isMounted) this.setState({item:item});
        });

        // If whatsapp number is not available yet:
        if(!this.state.whatsappAvailable)
        {
          // Get whatsapp number of the other person involved in this service request:
          getWhatsapp((item.isClient)?item.serverId:item.hostId).then(whatsapp=>
          {
            // Then, update the whatsapp number:
            item.whatsapp = whatsapp;
            if(this._isMounted) this.setState({item:item, whatsappAvailable:true});
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
      if(this._isMounted) this.setState({disabledDone:true});
      let networkId = this.state.networkId;
      const markRequestDone = firebase.functions().httpsCallable('markRequestDone');

      markRequestDone({uid: uid, postId: id, networkId: networkId})
      .then(({ data }) => {
        console.log('[Client] Server successfully posted')
        alert('Your reputation points increased!')
        this.props.navigation.navigate('DashboardScreen')
      })
      .catch(HttpsError => {
          console.log(HttpsError.code); // invalid-argument
      })
    }
  }

  // Open Guest List Page: this page has the list of everyone who is interested in this activity
  openGuestList = (itemId, hostId) =>
  {
    this.props.navigation.navigate('GuestList',{taskId: itemId, hostId: hostId})
  }

  openChat = (item) =>
  {
    //create an array of all users involved so that we can increment their unread message count later
    let usersInvolved = [];
    this.state.confirmedGuestList.map(guest =>
      {
        usersInvolved.push(guest.id);
      })
    usersInvolved.push(item.hostId);
    console.log('usersInvolved', usersInvolved);

    this.props.navigation.navigate("Chat", {
      name: item.selfName,
      taskId: item.id,
      userList: usersInvolved,
    })
  }

  openProfile = (uid) =>
  {
    this.props.navigation.navigate('ViewProfile',{profileUid: uid})
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
      console.log('item.isClient: ', item.isClient);

      markRequestCancelled(uid, item.id, item.isClient).then(resp =>
      {
        console.log('cancelled');
        if(!item.isClient){
          if(this._isMounted) this.setState({optedOut: true});
        }
        //Do nothing
        //this.props.navigation.navigate('DashboardScreen')
      });


  }

  onReportPress = () => {
    Alert.alert(
    'Confirmation',
    'You may report this post if you think it is inappropriate or it violates our Terms of Service',
    [
      {text: 'Cancel', onPress: () => console.log('Report Revoked')},
      {text: 'Report', onPress: () => this.onReportConfirm()}
    ]
  );
  }

  onReportConfirm = () => {
    const {id} = this.state.item;
    let user = firebase.auth().currentUser;
    if (user != null) {
      let selfUid = user.uid;
      const report = firebase.functions().httpsCallable('report');
      report({uid: selfUid, reportID: id, contentType: 'post' , reportType: 'inappropriate'})
      .then(({ data }) => {
        console.log('[Client] Report Success')
        alert('This post has been reported as inappropriate. Our team will look into it.')
        this.props.navigation.goBack();
      })
      .catch(HttpsError => {
          console.log(HttpsError.code); // invalid-argument
      })
    } else {
      alert('Please signin')
      this.props.navigation.navigate('Login')
    }
  }

  renderGuests = ({item}) => {
      const {id, fullName, guestStatus, thumbnail} = item;

      return (
        <View>
        {guestStatus != 3 && <ListItem
          title={fullName}
          titleStyle={adourStyle.listItemText}
          chevron={false}
          onPress={() => this.openProfile(id)}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftAvatar={{ source: { uri: thumbnail } }}
        />}
        {guestStatus == 3 && <ListItem
          title={fullName + " has left"}
          titleStyle={adourStyle.greyText}
          chevron={false}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftAvatar={{ source: { uri: thumbnail } }}
        />}
        </View>
      )
  }

  render()
  {
    const {item, confirmedGuestList, unreadChatCount, optedOut} = this.state;
    console.log('DashboardScreen is displaying the item with ID: ', item.id);
    var statusStr = 'Not available';
    let host = 'Anonymous';
    if(!item.anonymous) host = item.hostName;
    if(typeof item.status != 'undefined')
    {
      switch(item.status)
      {
        case 0: statusStr = 'Looking for attendees'; break;
        case 1: statusStr = (item.isClient)?'Upcoming activity':'Upcoming activity'; break;
        case 2: statusStr = 'Completed'; break;
        case 3: statusStr = (item.isClient)?'Cancelled by you':'Cancelled by the host'; break;
        case 4: statusStr = (item.isClient)?'Cancelled by your attendee':'Cancelled by you';break; //case 4 is useless now
      }
    }
    return (
      <ScrollView>
      <View style={styles.mainContainer}>
      <OfflineNotice />
      <Card featuredTitle={item.customTitle} featuredTitleStyle={adourStyle.listItemText} image={{uri: item.bgImage}}>
          <ListItem
              title={host}
              titleStyle={adourStyle.listItemText}
              subtitle="Host"
              subtitleStyle={adourStyle.listItemText}
              rightIcon={item.verified? <MaterialComIcon name={'check-circle'} size={25} color={'#5C7AFF'} /> : null}
              leftAvatar={{ source: { uri: item.hostThumb } }}
              onPress={item.anonymous? () =>  alert('The host is anonymous. Can\'t open profile.') : () => this.openProfile(item.hostId)}
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

      {!optedOut && <Card>

           {
             item.isClient && item.status == 0 &&
                  <View>
                   <Button onPress={()=>this.openGuestList(item.id, item.hostId)}
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
           item.status < 2 &&
                <Button
                    onPress={()=>this.confirmCancel(item)}
                    buttonStyle={adourStyle.btnCancel}
                    titleStyle={adourStyle.btnText}
                    title={(item.isClient)?"Remove":"Opt Out"}
                />
          }
          {
           item.status == 3 &&
                <Button
                    onPress={()=>this.confirmCancel(item)}
                    buttonStyle={adourStyle.btnCancel}
                    titleStyle={adourStyle.btnText}
                    title={"Remove"}
                />
          }
        </Card>}
        {
            !item.isClient && !this.state.fetching && <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Text style={adourStyle.defaultText} onPress={() => this.onReportPress()}>Flag as inappropriate</Text>
            </View>
        }
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
