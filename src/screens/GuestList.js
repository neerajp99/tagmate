import React, {Component} from 'react';
import {Card, ListItem, Button, Avatar} from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {View, ActivityIndicator, Alert, StyleSheet, Text, TextInput, Linking, FlatList, ScrollView, Dimensions, TouchableOpacity} from 'react-native'
import {getName, getLastName, finalizeGuestList, getNetworkId} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {canRequestMore} from '../lib/firebaseUtils.js';
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')
let uid;

class GuestList extends Component {
  constructor(props) {
      super(props);
      this.state = {
          myTasks: [],
          guestList: [],
          disabledBtn: false,
          item:{id:this.props.navigation.state.params.taskId, hostId:this.props.navigation.state.params.hostId}, // Loading service request's ID which was passed on
          fetching: false,
      };
  }

  componentDidMount(){
      this._isMounted = true;
      this.setState({fetching:true});
      let user = firebase.auth().currentUser;
      if (user != null) {
        uid = user.uid;
      }
      getNetworkId(uid).then(networkId => {
        if(this._isMounted) this.setState({networkId});
        this.getGuestList();
      })
      this.blockedListener();

  }

  componentWillUnmount()
  {
      this._isMounted = false;
  }

  //Listen for new blocked users and then automatically reject them (needed for iOS review)
  // Possible issue: this runs even if the blocked user is NOT in the guest list
  blockedListener = () => {
    let blockedRef = firebase.database().ref(`users/${uid}/block/`);
    //REALTIME
    //When the user blocks someone new
    blockedRef.child('blocked').on('child_added', (snapshot) => {
        let blockedUser = snapshot.val();
        if(this._isMounted) this.rejectGuest(blockedUser.id);
    })
  }


    /* DOESNT WORK: Tried to solve the above issue
    blockedRef.child('blocked').on('child_added', (snapshot) => {
      //If there is a change, use the function getBlockedList to create the updated combined blockedList
        //Remove any posts hosted by the blockedUid
        let blockedUser = snapshot.val();
        guestList.map(guest => {
          if(guest.id === blockedUser.id) this.rejectGuest(blockedUser.id);
        })
    })
    */


  openProfile = (uid) =>
  {
    this.props.navigation.navigate('ViewProfile',{profileUid: uid})
  }

    // Home to all the listeners for the guest list object for this serviceRequest ID
    getGuestList = () => {
      if(this._isMounted)
      {
          let networkId = this.state.networkId;
          var ref = firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}/acceptorIds`);
          console.log('inside getGuestList');
          ref.on('value', (snapshot) => {
          if(snapshot.val() == null){
            //no potential guests available
            if(this._isMounted) this.setState({fetching:false, disabledBtn: true});
            return;
           }
          console.log('snapshot.val(): ', snapshot.val());
          let data = snapshot.val();
          let guestItems = Object.values(data);
          if(this._isMounted) this.setState({ guestList: guestItems, fetching:false });
          console.log('guestList state: ', this.state.guestList);
        });

        //Update when something changes in realtime
        ref.on('child_changed', (snapshot) => {
          let data = snapshot.val();
          let guestItems = Object.values(data);
          if(this._isMounted) this.setState({ guestList: guestItems });
        });
      }

    }

    acceptGuest = (id) => {
      let networkId = this.state.networkId;
      ref = firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}/acceptorIds/${id}`);
      ref.update({guestStatus: 1})
    }

    rejectGuest = (id) => {
      let networkId = this.state.networkId;
      ref = firebase.database().ref(`networks/${networkId}/allPosts/${this.state.item.id}/acceptorIds/${id}`);
      ref.update({guestStatus: 2})
    }

    confirmGuestList = () => {
      let incomplete = false;
      let undecidedGuests = this.state.guestList.filter(guest => guest.guestStatus == 0);
      if(undecidedGuests.length > 0){
        incomplete = true;
      }
      if(incomplete){
        alert('Please make allow/disallow all potential guests');
        return;
      }
      if(!incomplete){
        finalizeGuestList(this.state.item.id, this.state.item.hostId).then(result => {
          if(result){
            Alert.alert(
                'Yay! 😍',
                'Guest List Finalized. You can now start chatting with your guests.',
                [
                  {text: 'Cool'},
                ]
              );
            this.props.navigation.navigate('DashboardDetails',{taskId: this.state.item.id});
          }else {
            alert('Please accept atleast one guest before finalizing the list');
          }
        })

      }
    }


    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const {id, guestStatus, fullName, thumbnail} = item;

        return (
          <View>
          <Card>
            <View style={styles.guestContainer}>
            <View style={{marginRight: 12, marginTop: 4}}>
              <Avatar
                rounded
                size="small"
                source={{uri: thumbnail}}
                onPress={() => this.openProfile(id)}
              />
            </View>
            <Text onPress={() => this.openProfile(id)} style={guestStatus < 2 ? adourStyle.listItemTextBoldL:adourStyle.fadedTextL }>{fullName}</Text>

            { guestStatus == 0 && <View style={styles.buttonsContainer}>
              <View>
                <TouchableOpacity style={styles.btnReject} onPress={() => { this.rejectGuest(id) }} >
                  <Icon name={'close'} size={25} color={'rgba(255, 255, 255, 1)'} />
                </TouchableOpacity>
              </View>
              <View>
                <TouchableOpacity style={styles.btnAccept} onPress={() => { this.acceptGuest(id) }}>
                  <Icon name={'check'} size={25} color={'rgba(255, 255, 255, 1)'} />
                </TouchableOpacity>
              </View>

            </View>}

            { guestStatus == 1 && <Text>CONFIRMED</Text>}

            </View>
          </Card>
            </View>
        )
    }

    render() {
      const {fetching, guestList} = this.state
        return (
          <View style={{flex: 2, marginBottom: 8}}>
          <ScrollView>
            <View style={styles.mainContainer}>
                {(guestList.length == 0) && <Text style={adourStyle.defaultText}>No potential guests. Please check back later.</Text>}
                {(guestList.length != 0) && <FlatList
                    data={guestList}
                    extraData={guestList}
                    renderItem={this.renderItem}
                    keyExtractor={(guestList, index) => guestList.id}
                />}
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={BRAND_COLOR_ONE} size={'large'}/>
                    </View>
                }
            </View>
            </ScrollView>

            <View style={{marginLeft: 15, marginRight: 15, marginBottom: 8}} >
            <Button
                onPress={()=>this.confirmGuestList()}
                buttonStyle={adourStyle.btnGeneralT}
                titleStyle={adourStyle.btnText}
                disabled={this.state.disabledBtn}
                title="Finalize List"
            />

            {/* <Button
                onPress={()=>this.props.navigation.goBack()}
                buttonStyle={adourStyle.btnGeneralT}
                titleStyle={adourStyle.btnText}
                title="Wait for More People to Join"
            /> */}
            </View>

            </View>
        )
    }
}

export default GuestList;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    btnAccept:{
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_COLOR_ONE
    },
    btnReject:{
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_COLOR_FOUR
    },
    guestContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      flex: 2
    },
    buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 2
    },
})
