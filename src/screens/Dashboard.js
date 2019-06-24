// This screen shows tasks hosting and attending by the user.

import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {countallPosts, isConfirmedAcceptor, deleteForever, getNetworkId} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, ButtonGroup, ListItem, Badge } from 'react-native-elements';
import * as _ from 'lodash';
import {adourStyle, BRAND_COLOR_ONE} from './style/AdourStyle';
import TimeAgo from 'react-native-timeago';

let uid;

class DashboardScreen extends Component {
    constructor(props) {
      super(props);
      this.state = {
        active:0, // Determines active tab: hosting Tasks or attending Tasks. Default: attending.
        fetching:false,
        attendingBadge: false,
        hosting:[], // Array of hosting services
        attending:[], // Array of attending tasks
      }
      this.runFirebaseListeners = this.runFirebaseListeners.bind(this);
      this.updateIndex = this.updateIndex.bind(this);
    }

    updateIndex (active) {
      this.setState({active})
    }

    componentDidMount(){
      this._isMounted = true;
      let user = firebase.auth().currentUser;
      if (user != null) {
        uid = user.uid;
      } else {
        this.props.navigation.navigate('Login')
      }
      this.setState({fetching:true});

      //countallPosts(networkId); //THIS IS TO GET STATISTICS. ENABLE WHEN REQUIRED
      //this.sendPushNotificationToHosts(hard code network Id here); //THIS IS A MANUAL CLOUD FUNCTION FOR ADMINS ONLY

      this.runFirebaseListeners();
    }

    componentWillUnmount(){
      this._isMounted = false;
    }

    runFirebaseListeners = () => {
      this.hostedPostsListeners();
      this.guestPostsListeners();
      this.unreadMsgListeners();
    }

    // Home to all the listeners for fetching the user's hosted posts
    hostedPostsListeners = () => {
      let userPostRef = firebase.database().ref(`/users/${uid}/posts`);
      //Get all the posts that this user is a host of
      userPostRef.child('host').on('child_added', (snapshot) => {
        let post = snapshot.val()
        //Check for unread msg count START
        if(post.status != 0)
        {
          firebase.database().ref(`/users/${uid}/messages/${post.id}/unreadCount`).once("value", function(unreadSnapshot)
          {
            if(unreadSnapshot.val() != null){
              post.unreadMsgs = unreadSnapshot.val();
            }
          });
        }
        //Check for unread msg count END
        this.setState({hosting:[post].concat(this.state.hosting)});
        if(this._isMounted) this.setState({fetching:false});
      });

      if(this._isMounted) this.setState({fetching:false});

      userPostRef.child('host').on('child_removed', (snapshot) => {
          // Remove it from both arrays:
          if(this._isMounted)
          this.setState({hosting: this.state.hosting.filter(item => item.id !== snapshot.key)});
      });

      // When a post object that the user is hosting changes on the realtime database, update its local state
      userPostRef.child('host').on('child_changed', (snapshot) => {
        var post = snapshot.val(); //this is the post object that changed
        let hosting_arr = []; // creating a new array for this.state.hosting;
        console.log('host changed. mounted? ', this._isMounted)
        if(this._isMounted)
        {
          //Look for the post locally that changed in the realtime database
          this.state.hosting.map(item =>
          {
            if(item.id == post.id) hosting_arr.push(post); //if we find it, add the updated post to the array
            else hosting_arr.push(item); // add all other posts as they were into the array
          });
          this.setState({hosting:hosting_arr});
        }
      });

    }

    sendPushNotificationToHosts = (networkId) => {
      const pushNotifyHostOnManual = firebase.functions().httpsCallable('pushNotifyHostOnManual');
      pushNotifyHostOnManual({networkId: networkId})
      .then(({ data }) => {
        console.log('[Client] Server successfully posted')
        alert('Push notification sent!')
      })
      .catch(HttpsError => {
          console.log(HttpsError.code); // invalid-argument
      })
    }


    // Home to all the listeners for fetching the user's hosted posts
    guestPostsListeners = () => {
      let userPostRef = firebase.database().ref(`/users/${uid}/posts`);

      //Get all the posts that this user is a guest of
      userPostRef.child('guest').on('child_added', (snapshot) => {
        let post  = snapshot.val()

        //Check for unread msg count for guest START
        if(post.status != 0)
        {
          let unreadAv = false;
          firebase.database().ref(`/users/${uid}/messages/${post.id}/unreadCount`).once("value", function(unreadSnapshot)
          {
            if(unreadSnapshot.val() != null && unreadSnapshot.val() != 0){
              post.unreadMsgs = unreadSnapshot.val();
              unreadAv = true;
            }
          }).then(result => {
              if(unreadAv) this.setState({attendingBadge: true})
            })
        }
        //Check for unread msg count END
        this.setState({attending:[post].concat(this.state.attending)});
      });

      userPostRef.child('guest').on('child_removed', (snapshot) => {
          // Remove it from both arrays:
          if(this._isMounted)
          this.setState({attending: this.state.attending.filter(item => item.id !== snapshot.key)});
      });


      // When a post object that the user is hosting changes on the realtime database, update its local state
      userPostRef.child('guest').on('child_changed', (snapshot) => {
        var post = snapshot.val(); //this is the post object that changed
        let attending_arr = []; // creating a new array for this.state.attending;

        if(this._isMounted)
        {
          //Look for the post locally that changed in the realtime database
          this.state.attending.map(item =>
          {
            if(item.id == post.id) attending_arr.push(post); //if we find it, add the updated post to the array
            else attending_arr.push(item); // add all other posts as they were into the array
          });
          this.setState({attending:attending_arr});
        }
      });

}

    // Listener to check for changes in any of the post's unread msg count
    unreadMsgListeners = () => {
      //If the user object's message is updated, this means the unread count mustve changed
      firebase.database().ref(`/users/${uid}/messages/`).on('child_changed', (snapshot) => {
        var ob = snapshot.val();
        //iterate through and look for a matching item Id with the changed object
        let hosting_arr = [];//this.state.hosting;
        let attending_arr = [];//this.state.attending;

        if(this._isMounted)
        {
            this.state.hosting.map(item =>
          {
            if(item.id == ob.taskId){
              item.unreadMsgs = ob.unreadCount;
              hosting_arr.push(item);
            }
            else hosting_arr.push(item);
          });
          this.state.attending.map(item =>
          {
            if(item.id == ob.taskId){
              item.unreadMsgs = ob.unreadCount;
              attending_arr.push(item);
            }
            else attending_arr.push(item);
          });

          //If no unread msgs are left in attending, disable the mini badge
          let unreadMsgTasks = [];
          unreadMsgTasks = this.state.attending.filter(item => item.unreadMsgs != 0 && item.unreadMsgs != undefined)
          console.log('unreadMsgTasks', unreadMsgTasks);
          if(unreadMsgTasks.length == 0) this.setState({attendingBadge: false})
          if(unreadMsgTasks.length != 0) this.setState({attendingBadge: true})

          this.setState({hosting:hosting_arr});
          this.setState({attending:attending_arr});
        }

      })
    }

    // Open Dashboard Details screen for the task the user has tapped.
    openDetails = (item) =>
    {
      this.props.navigation.navigate('DashboardDetails',{taskId: item.id})
    }

    userGuideContainer = (active) =>
    {
      if(active){
          if(this.state.attending.length == 0) {
            //Get Display Name
            let user = firebase.auth().currentUser;
            let displayName;
            if (user != null) {
              displayName = user.displayName;
            }
            return <View style={{marginLeft: 20, marginRight: 18, marginTop: 20}}>
                      <Text style={adourStyle.guideText}>
                      Hello {displayName} {"\n"} {"\n"}You do not have any upcoming gatherings. {"\n"} {"\n"}
                      "Twenty years from now, you will be more disappointed by the things you didn't do than by the ones you did do." - Mark Twain
                      </Text>
                    </View>
          }
      } else {

        if(this.state.hosting.length == 0) {
          return <View style={{marginLeft: 20, marginRight: 18, marginTop: 20}}>
                    <Text style={adourStyle.guideText}>
                    It's pitch white in here! {"\n"} {"\n"} Magic lies outside your comfort zone. {"\n"}{"\n"}
                    </Text>
                  </View>
        }
      }
    }

    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const{id, created_at, details, customTitle, interestedCount} = item;
        const uid = this.state.uid;
        let notifications = 0;
        let badgeColor = 'success'; // this is to change the color of the badge according to whether its a chat notif or a interested people notif
        if(interestedCount != null && interestedCount != undefined && item.status == 0){
          notifications = interestedCount;
          badgeColor = 'primary';
        } else if (item.status != 0 && item.unreadMsgs != undefined){
          notifications = item.unreadMsgs;
        }

        // Find appropriate status for current status code:
        var statusStr = 'Not available';
        switch(item.status)
        {
          case 0: statusStr = `Open: ${interestedCount}+ interested`; break;
          case 1: statusStr = 'Guest List Finalized'; break;
          case 2: statusStr = 'Completed'; break;
          case 3:
          case 4: statusStr = 'Cancelled'; break;
        }

        /* Update: removed the following code
        rightTitle={<TimeAgo time={created_at} />}
        rightTitleStyle={adourStyle.listItemText}
        */

        return (
          <View key={id}>
            <View>
                  <ListItem
                    title={customTitle}
                    titleStyle={(item.status<2)?adourStyle.listItemTextBold:adourStyle.fadedText}
                    subtitle={statusStr}
                    subtitleStyle={adourStyle.listItemText}
                    containerStyle={{backgroundColor: '#fff'}}
                    onPress={() => this.openDetails(item)}
                    chevron={true}
                    bottomDivider={true}
                    badge={(notifications!=0)? { value: notifications, status: badgeColor } : null}
                  />

            </View>
          </View>
        )
    }

    render() {
        const {fetching, attending, hosting, active, attendingBadge} = this.state
        const buttons = ['Hosting', 'Attending']

        return (
          <View style={styles.mainContainer}>
              <View>
                <ButtonGroup
                  onPress={this.updateIndex}
                  selectedIndex={active}
                  buttons={buttons}
                  textStyle={adourStyle.buttonText}
                  containerStyle={{height: 45}}
                />
                {attendingBadge && <Badge status="success" containerStyle={{ position: 'absolute', top: 4, right: 8 }} />}
            </View>
              {!fetching && this.userGuideContainer(active)}

              {
                !fetching &&  <FlatList
                    data={(active == 0)?hosting:attending}
                    extraData={(active == 0)?hosting:attending}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
              }
              <View style={{marginBottom:30, marginLeft: 20, marginRight: 20}}>
              <Button title="Create A Post" titleStyle={adourStyle.buttonTextBold} buttonStyle={adourStyle.btnGeneral} disabled={this.state.disabledBtn} onPress={() => {this.props.navigation.navigate('Home')}}/>
              </View>

              {
                  fetching && <View style={styles.progressContainer}>
                      <ActivityIndicator color={BRAND_COLOR_ONE} size={'large'}/>
                  </View>
              }
          </View>
        )
    }
}

export {DashboardScreen};

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
    contentContainer: {
        width: '100%'
    }
})
