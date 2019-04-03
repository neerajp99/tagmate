// This screen shows tasks requested and accepted by the user.

import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {getAllRelatedTasks, getWhatsapp, getAllServices, countServicesRequests} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import { Button, ButtonGroup, ListItem } from 'react-native-elements';
import * as _ from 'lodash';
import {adourStyle, BRAND_COLOR_ONE} from './style/AdourStyle';
import TimeAgo from 'react-native-timeago';

class DashboardScreen extends Component {
    constructor(props) {
      super(props);
      this.state = {
        active:0, // Determines active tab: Requested Tasks or Accepted Tasks. Default: Accepted.
        fetching:false,
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
      //countServicesRequests(); THIS IS TO GET STATISTICS. ENABLE WHEN REQUIRED
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

      var ref = firebase.database().ref('servicesRequests')

      // When a new service request object is added:
      ref.on('child_added', (snapshot) => {
        if(this._isMounted) this.setState({fetching:false});
        var request = snapshot.val();
        //If the user is the requester, and it is not a cancelled activity add to requested array:
        if(request.clientId == uid && (request.status < 3) && this._isMounted) this.setState({requested:[request].concat(this.state.requested)});
        //If the user is the accepter, add to accepted array:
        else if(request.serverId == uid && (request.status < 3) && this._isMounted) this.setState({accepted:[request].concat(this.state.accepted)});
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
        // Do nothing if the service request was not related to the user:
        //if(request.clientId != uid && request.serverId != uid) return;
        // If it is a service request the user has recently accepted, add it to accepted array:
        if(request.status == 1 && request.serverId == uid && this._isMounted) this.setState({accepted:[request].concat(this.state.accepted)});
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
            if(item.id == request.id) acc.push(request);
            else acc.push(item);
          });
          this.setState({requested:req});
          this.setState({accepted:acc});
        }
      });
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
        if(this.state.requested.length == 0) {
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
        const{serviceId, id, created_at, details} = item;
        const {services} = this.state
        var serviceTitle = '---';
        console.log(services);
        // Find service title corresponding to the service ID of the service request:
        services.map(service => {
            if(service.id == serviceId)
            {
                serviceTitle = service.title;
            }
        });
        // Find appropriate status for current status code:
        var statusStr = 'Not available';
        switch(item.status)
        {
          case 0: statusStr = 'Looking for a match'; break;
          case 1: statusStr = 'Matched'; break;
          case 2: statusStr = 'Meetup completed.'; break;
          case 3:
          case 4: statusStr = 'Meetup cancelled.'; break;
        }
        return (
          <View key={id}>
            <View>
                  <ListItem
                    title={serviceTitle}
                    titleStyle={(item.status<2)?adourStyle.listItemTextBold:adourStyle.fadedText}
                    subtitle={statusStr}
                    subtitleStyle={adourStyle.listItemText}
                    rightTitle={<TimeAgo time={created_at} />}
                    rightTitleStyle={adourStyle.listItemText}
                    containerStyle={{backgroundColor: '#fff'}}
                    onPress={() => this.openDetails(item)}
                  />
            </View>
          </View>
        )
    }

    render() {
        const {fetching, accepted, requested, active} = this.state
        const buttons = ['My Activities', 'Accepted Activities']

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
              <View style={{marginBottom:30}}>
              <Button title="Create A Post" textStyle={adourStyle.buttonTextBold} buttonStyle={adourStyle.btnGeneral} disabled={this.state.disabledBtn} onPress={() => {this.props.navigation.navigate('Chillmate')}}/>
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
