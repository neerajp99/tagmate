// This screen shows tasks requested and accepted by the user.

import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {getAllRelatedTasks, getWhatsapp, getAllServices, countServicesRequests, isConfirmedAcceptor, deleteForever} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button, ButtonGroup, ListItem, Badge } from 'react-native-elements';
import * as _ from 'lodash';
import {adourStyle, BRAND_COLOR_ONE} from './style/AdourStyle';
import TimeAgo from 'react-native-timeago';

class DashboardScreen extends Component {
    constructor(props) {
      super(props);
      this.state = {
        active:0, // Determines active tab: Requested Tasks or Accepted Tasks. Default: Accepted.
        fetching:false,
        acceptedBadge: false,
        requested:[], // Array of requested services
        accepted:[], // Array of accepted tasks
      }
      this.getAllRelatedTasks = this.getAllRelatedTasks.bind(this);
      this.updateIndex = this.updateIndex.bind(this);
    }

    updateIndex (active) {
      this.setState({active})
    }

    componentDidMount(){
      this._isMounted = true;
      this.setState({fetching:true});
      //countServicesRequests(); //THIS IS TO GET STATISTICS. ENABLE WHEN REQUIRED
      getAllServices().then(services => // Get all possible services, then:
      {
        this.setState({services});
        this.getAllRelatedTasks();
      });
    }

    componentWillUnmount(){
      this._isMounted = false;
    }

    // Home to all the listeners for the service request objects:
    getAllRelatedTasks = () => {
      const {currentUser: {uid} = {}} = firebase.auth()
      var ref = firebase.database().ref('servicesRequests');

      var userPostRef = firebase.database().ref(`/users/${uid}/posts`)

      //Get all the posts that this user is a host of
      userPostRef.child('host').on('value', (snapshot) => {
        let userHostedPosts = [];

        if(this._isMounted) this.setState({fetching:false});
        snapshot.forEach(function(childSnapshot) {

          const {id} = childSnapshot.val();
          console.log('id: ', id);

          firebase.database().ref(`servicesRequests/${id}`).once('value', (postSnapshot) => {
            let request = postSnapshot.val();
            console.log('postSnapshot.val(): ', request);
            console.log('isMounted ', this._isMounted);

            //Check for unread msg count START
            if(request.status != 0)
            {
              firebase.database().ref(`/users/${uid}/messages/${id}/unreadCount`).once("value", function(unreadSnapshot)
              {
                if(unreadSnapshot.val() != null){
                  request.unreadMsgs = unreadSnapshot.val();
                }
              });
            }
            //Check for unread msg count END

            //Finally add this post object to the array that is going to be rendered
            userHostedPosts.push(request);
          })
        });

        if(this._isMounted){
            this.setState({requested:userHostedPosts});
            console.log('this.state.requested: ', this.state.requested)
            console.log('this.state.requested.length: ', this.state.requested.length)
        }

      })

      //Get all posts that this user is a guest of / accepted posts
      userPostRef.child('guest').on('value', (snapshot) => {
        let userAcceptedPosts = [];

        if(this._isMounted) this.setState({fetching:false});
        snapshot.forEach(function(childSnapshot) {

          const {id} = childSnapshot.val();
          console.log('guest: id: ', id);

          firebase.database().ref(`servicesRequests/${id}`).once('value', (postSnapshot) => {
            let request = postSnapshot.val();
            console.log('guest: postSnapshot.val(): ', request);

            //Check for unread msg count START
            if(request.status != 0)
            {
              let unreadAv = false;
              firebase.database().ref(`/users/${uid}/messages/${id}/unreadCount`).once("value", function(unreadSnapshot)
              {
                if(unreadSnapshot.val() != null && unreadSnapshot.val() != 0){
                  request.unreadMsgs = unreadSnapshot.val();
                  unreadAv = true;
                }
              }).then(result => {
                  if(unreadAv) this.setState({acceptedBadge: true})
                })
            }
            //Check for unread msg count END

            //Finally add this post object to the array that is going to be rendered
            userAcceptedPosts.push(request);
          })
        });

        if(this._isMounted){
            this.setState({accepted:userAcceptedPosts});
            console.log('this.state.accepted: ', this.state.accepted)
        }

      })

      /* START

      // When a new service request object is added:
      ref.on('child_added', (snapshot) => {
        if(this._isMounted) this.setState({fetching:false});
        var request = snapshot.val();
        //Checking if this task object has the property anonymous. If the task object has the property anonymous that means it is a post from v2 of the app. Posts from old version do not have this property
        // We do this to ensure we only show posts from the new version of the app
        if(request.anonymous != undefined)
        {


            //If the user is the requester, and it is not a cancelled activity add to requested array:
          if(request.clientId == uid && (request.status < 3) && this._isMounted){
            //Add a new property to see how many unread msgs this user has in this task
            if(request.status != 0)
            {
              firebase.database().ref(`/users/${uid}/messages/${request.id}/unreadCount`).once("value", function(snapshot)
              {
                if(snapshot.val() != null){
                  request.unreadMsgs = snapshot.val();
                }
              });
            }

            this.setState({requested:[request].concat(this.state.requested)});
            console.log('this.state.requested: ', this.state.requested)

          }
          //If the user is the confirmed accepter, add to accepted array:
          isConfirmedAcceptor(uid, request.id).then(result => {
            if( result && (request.status < 3) && this._isMounted) {
              //Add a new property to see how many unread msgs this user has in this task
              if(request.status != 0)
              {
                let unreadAv = false;
                firebase.database().ref(`/users/${uid}/messages/${request.id}/unreadCount`).once("value", function(snapshot)
                {

                  if(snapshot.val() != null && snapshot.val() != 0){
                    request.unreadMsgs = snapshot.val();
                    unreadAv = true;
                  }
                }).then(result => {
                  if(unreadAv) this.setState({acceptedBadge: true})
                })
              }
              this.setState({accepted:[request].concat(this.state.accepted)});
            }
          })


        }
      });

      // When an existing service request object is removed:
      ref.on('child_removed', (snapshot) => {
          // Remove it from both arrays:
          if(this._isMounted)
          this.setState({
            requested: this.state.requested.filter(item => item.id !== snapshot.key),
            accepted: this.state.accepted.filter(item => item.id !== snapshot.key),
          });
      });

      // When contents of an existing service request object are changed:
      ref.on('child_changed', (snapshot) => {
        var request = snapshot.val();
        // If it is a service request the user has recently unmatched, it means the user is neither the server or the client anymore. Remove it from the accepted array:
        if(request.serverId != uid && request.clientId != uid && this._isMounted){
          this.setState({accepted: this.state.accepted.filter(function(element) {
              return element.id !== request.id
          })});
        }

        //If the user is the confirmed accepter, add to accepted array:
        isConfirmedAcceptor(uid, request.id).then(result => {
          if( result && (request.status < 3) && this._isMounted){
            //Add a new property to see how many unread msgs this user has in this task
            //unread msg check start
            if(request.status != 0)
            {
              let unreadAv = false;
              firebase.database().ref(`/users/${uid}/messages/${request.id}/unreadCount`).once("value", function(snapshot)
              {

                if(snapshot.val() != null && snapshot.val() != 0){
                  request.unreadMsgs = snapshot.val();
                  unreadAv = true;
                }
              }).then(result => {
                if(unreadAv) this.setState({acceptedBadge: true})
              })
            }
            //unread msg check end
            this.setState({accepted:[request].concat(this.state.accepted)});
          }
          // Do nothing if the service request was not related to the user:
          //if(request.clientId != uid && request.serverId != uid) return;
          // Else, find it in the arrays and replace it with the new information.
          else if(this._isMounted)
          {
            let req = [];//this.state.requested;
            let acc = [];//this.state.accepted;

            this.state.requested.map(item =>
            {
              if(item.id == request.id) req.push(request);
              else req.push(item);
            });
            this.state.accepted.map(item =>
            {
              if(item.id == request.id && item.clientId != uid) acc.push(request);
              else acc.push(item);
            });

            this.setState({requested:req});
            this.setState({accepted:acc});
          }
        })


      });
      END */

      //If the user object's message is updated, this means the unread count mustve changed
      firebase.database().ref(`/users/${uid}/messages/`).on('child_changed', (snapshot) => {
        var ob = snapshot.val();
        //iterate through and look for a matching item Id with the changed object
        let req = [];//this.state.requested;
        let acc = [];//this.state.accepted;

        if(this._isMounted)
        {
            this.state.requested.map(item =>
          {
            if(item.id == ob.taskId){
              item.unreadMsgs = ob.unreadCount;
              req.push(item);
            }
            else req.push(item);
          });
          this.state.accepted.map(item =>
          {
            if(item.id == ob.taskId){
              item.unreadMsgs = ob.unreadCount;
              acc.push(item);
            }
            else acc.push(item);
          });

          //If no unread msgs are left in accepted, disable the mini badge
          let unreadMsgTasks = [];
          unreadMsgTasks = this.state.accepted.filter(item => item.unreadMsgs != 0 && item.unreadMsgs != undefined)
          console.log('unreadMsgTasks', unreadMsgTasks);
          if(unreadMsgTasks.length == 0) this.setState({acceptedBadge: false})
          if(unreadMsgTasks.length != 0) this.setState({acceptedBadge: true})

          this.setState({requested:req});
          this.setState({accepted:acc});
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
          if(this.state.accepted.length == 0) {
            //Get Display Name
            const {currentUser: {displayName} = {}} = firebase.auth();
            return <View style={{marginLeft: 20, marginRight: 18, marginTop: 20}}>
                      <Text style={adourStyle.guideText}>
                      Hello {displayName} {"\n"} {"\n"}You haven't accepted any conversation requests yet. {"\n"} {"\n"}
                      "Twenty years from now, you will be more disappointed by the things you didn't do than by the ones you did do." - Mark Twain
                      </Text>
                    </View>
          }
      } else {
        /* disabling due to glitch, tempororily

        if(this.state.requested.length == 0) {
          return <View style={{marginLeft: 20, marginRight: 18, marginTop: 20}}>
                    <Text style={adourStyle.guideText}>
                    It's pitch white in here! {"\n"} {"\n"} Magic lies outside your comfort zone. {"\n"}{"\n"}
                    </Text>
                  </View>
        }
        */
      }
    }

    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const{serviceId, id, created_at, details, custom, customTitle, interestedCount} = item;
        const {services} = this.state
        const {currentUser: {uid} = {}} = firebase.auth()
        let notifications = 0;
        let badgeColor = 'success'; // this is to change the color of the badge according to whether its a chat notif or a interested people notif
        if(interestedCount != null && interestedCount != undefined && item.status == 0){
          notifications = interestedCount;
          badgeColor = 'primary';
        } else if (item.status != 0 && item.unreadMsgs != undefined){
          notifications = item.unreadMsgs;
        }
        var serviceTitle = '---';
        if(!custom)
        {
          // Find service title corresponding to the service ID of the service request:
          services.map(service => {
              if(service.id == serviceId)
              {
                  serviceTitle = service.title;
              }
          });
        } else {
          //this is a custom post, get title from post instead of global service object
          serviceTitle = customTitle;
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
                    title={serviceTitle}
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
        const {fetching, accepted, requested, active, acceptedBadge} = this.state
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
                {acceptedBadge && <Badge status="success" containerStyle={{ position: 'absolute', top: 4, right: 8 }} />}
            </View>
              {!fetching && this.userGuideContainer(active)}

              {
                !fetching &&  <FlatList
                    data={(active == 0)?requested:accepted}
                    extraData={(active == 0)?requested:accepted}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
              }
              <View style={{marginBottom:30, marginLeft: 20, marginRight: 20}}>
              <Button title="Create A Post" titleStyle={adourStyle.buttonTextBold} buttonStyle={adourStyle.btnGeneral} disabled={this.state.disabledBtn} onPress={() => {this.props.navigation.navigate('Chillmate')}}/>
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
