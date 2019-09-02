import React, {Component} from 'react';
import {Card, ListItem, Button, Avatar, Icon} from 'react-native-elements';
import {View, ActivityIndicator, Alert, StyleSheet, Text, TextInput, Linking, FlatList, ScrollView, Dimensions, TouchableOpacity} from 'react-native'
import {getName, getLastName, getFullName, getThumbURL, getBlockedList, finalizeGuestList, getNetworkId} from "../lib/firebaseUtils";
import ActionSheet from 'react-native-actionsheet'
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {canRequestMore} from '../lib/firebaseUtils.js';
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')
let uid;

class DirectMessages extends Component {
  constructor(props) {
      super(props);
      this.state = {
          peopleList: [],
          fetching: false,
          blockedList: [],
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
        getBlockedList(uid).then(blockedList => {
          if(this._isMounted) this.setState({networkId, blockedList});
          this.getConversationList();
        })
      })
      this.blockedListListener();

  }

  componentWillUnmount()
  {
      this._isMounted = false;
  }


  openProfile = (uid) =>
  {
    this.props.navigation.navigate('ViewProfile',{profileUid: uid})
  }

  // deleteConversation = (uid, targetUid) =>
  // {
  //   firebase.database().ref(`users/${uid}/directMessages/${targetUid}`).remove();
  // }

  deleteConversationAlert = (uid, targetUid) =>
  {
    // let roomName = (uid<targetUid ? uid+'_'+targetUid : targetUid+'_'+uid);
    // console.log('roomName: ', roomName);
    //firebase.database().ref(`directMessages/${roomName}`).remove();
    Alert.alert(
    'Confirmation',
    'Are you sure you want to hide this conversation? In order to message this person again, you will have to go to their profile.',
    [
      {text: 'Cancel'},
      {text: 'Confirm', onPress: () => firebase.database().ref(`users/${uid}/directMessages/${targetUid}`).remove() }
    ]
  );
  }

  showActionSheet = () => {
    this.ActionSheet.show()
  }

  onBlockPress = (uid) => {
    getName(uid).then(name => {
      Alert.alert(
        'Confirmation',
        `If you block ${name}, both you and ${name} won\'t be able to see each other\'s posts or send messages to each other in the future. This will also delete your chat. Please confirm.`,
        [
          {text: 'Cancel', onPress: () => console.log('Block cancelled')},
          {text: 'Block', onPress: () => this.onBlockConfirm(name)}
        ]
      );
    })
  }

  onBlockConfirm = (name) => {
    let user = firebase.auth().currentUser;
    if (user != null) {
      let selfUid = user.uid;
      const blockUser = firebase.functions().httpsCallable('blockUser');
      blockUser({selfUid: selfUid, toBlockUid: uid })
      .then(({ data }) => {
        console.log('[Client] Report Success')
        alert(`${name} has been blocked`)
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

  openChat = (targetUid) =>
  {
    getName(uid).then(selfName=>
    {
      this.props.navigation.navigate("DirectChat", {
        name: selfName,
        targetUid: targetUid
      })

    });
  }


  //If there is a change in blocked list while the user is on this screen, update the blockedList state
  blockedListListener = () => {
    //Currently only taking care of when the user blocks someone new. Does not work when user unblocks. S/he must reload the app in that case.
    let blockedRef = firebase.database().ref(`users/${uid}/block/`);
    //When the user blocks someone new
    blockedRef.child('blocked').on('child_added', (snapshot) => {
      //If there is a change, use the function getBlockedList to create the updated combined blockedList
        //Remove any posts hosted by the blockedUid
        let blockedUid = snapshot.val();
        this.setState({peopleList: this.state.peopleList.filter(item => item.uid !== snapshot.key)});
    })
    //Listen for changes in the list of users that has blocked the current user
    blockedRef.child('blockedBy').on('child_added', (snapshot) => {
      //Remove any posts hosted by the blockedUid
      let blockedUid = snapshot.val();
      this.setState({peopleList: this.state.peopleList.filter(item => item.uid !== snapshot.key)});
    })
    //listen for changes in the list of users that the admin has soft blocked
    firebase.database().ref('admin/softBlockedUids').on('child_added', (snapshot) => {
      //Remove any posts hosted by the blockedUid
      let blockedUid = snapshot.val();
      this.setState({peopleList: this.state.peopleList.filter(item => item.uid !== snapshot.key)});
    })

  }

    getConversationList = () => {
      let ref = firebase.database().ref(`users/${uid}/directMessages`);
      const {blockedList} = this.state;
      //Get all the posts that this user is a host of
      ref.on('child_added', (snapshot) => {
        console.log('snapshot.val(): ', snapshot.val().id)
        let person = snapshot.val()
        console.log('person.uid: ', person.uid)
        if(!blockedList.includes(person.uid)){
          getFullName(person.uid).then(name => {
            person.fullName = name;
            console.log('name: ', name)
            console.log('person.fullName: ', person.fullName)
            getThumbURL(person.uid).then(thumbURL => {
              person.thumbnail = thumbURL;

              firebase.database().ref(`/users/${uid}/directMessages/${person.uid}/unreadCount`).once("value", function(unreadSnapshot)
              {
                if(unreadSnapshot.val() != null){
                  person.unreadMsgs = unreadSnapshot.val();
                }else{
                  person.unreadMsgs = 0;
                }
              }).then(finRes => {
                this.setState({peopleList:[person].concat(this.state.peopleList), fetching: false});
              })
            })
          })
        }

      })

      ref.on('child_changed', (snapshot) => {
        let person = snapshot.val()
        let peopleArray = [];

        if(!blockedList.includes(person.uid)){
          getFullName(person.uid).then(name => {
            person.fullName = name;
            getThumbURL(person.uid).then(thumbURL => {
              person.thumbnail = thumbURL;

              firebase.database().ref(`/users/${uid}/directMessages/${person.uid}/unreadCount`).once("value", function(unreadSnapshot)
              {
                if(unreadSnapshot.val() != null){
                  person.unreadMsgs = unreadSnapshot.val();
                }else{
                  person.unreadMsgs = 0;
                }
              }).then(finRes => {
                if(this._isMounted)
                {
                  this.state.peopleList.map(item =>
                  {
                    if(item.uid == person.uid) peopleArray.push(person);
                    else peopleArray.push(item);
                  });
                  this.setState({peopleList:peopleArray});
                }
              })
            })
          })
        }

      })

      ref.on('child_removed', (snapshot) => {
        this.setState({peopleList: this.state.peopleList.filter(item => item.uid !== snapshot.key)});
      })

      this.setState({fetching: false});


    }


    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const {fullName, thumbnail, unreadMsgs} = item;

        console.log('item.uid: ', item.uid);
        console.log('fullName: ', fullName);
        console.log('thumbnail: ', thumbnail);

        return (
          <View key={item.uid}>
          <Card>
          <ListItem
            title={fullName}
            titleStyle={adourStyle.listItemText}
            leftAvatar={{ source: { uri: thumbnail } }}
            onPress={() => this.openChat(item.uid)}
            rightElement={<Icon
              name="dots-horizontal"
              size={22}
              type="material-community"
              onPress={this.showActionSheet}
              color="grey"
              />}
            badge={unreadMsgs!=0? { value: unreadMsgs, status: 'success' } : null}
          />
          <ActionSheet
            ref={o => this.ActionSheet = o}
            options={['Hide', 'Block', 'Cancel']}
            cancelButtonIndex={2}
            destructiveButtonIndex={1}
            onPress={(index) => {
              if(index === 1){
                this.onBlockPress(item.uid)
              }else if(index === 0){
                this.deleteConversationAlert(uid, item.uid)
              }
          }}
          />
          </Card>
          </View>
        )
    }

    render() {
      const {fetching, peopleList} = this.state
      console.log('peopleList: ', peopleList)

        return (
          <View style={{flex: 2, marginBottom: 8, backgroundColor: '#eceff1'}}>
          <ScrollView>
            <View style={styles.mainContainer}>
                {(peopleList.length == 0) && <Text style={adourStyle.defaultText}>No direct chats.</Text>}
                {(peopleList.length != 0) && <FlatList
                    data={peopleList}
                    extraData={peopleList}
                    renderItem={this.renderItem}
                    keyExtractor={(peopleList, index) => index.toString() }
                />}
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={BRAND_COLOR_ONE} size={'large'}/>
                    </View>
                }
            </View>
            </ScrollView>


            </View>
        )
    }
}

export default DirectMessages;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#eceff1'
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
