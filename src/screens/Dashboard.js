import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {getAllRelatedTasks, getWhatsapp, getAllServices} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import { Button } from 'react-native-elements';
import * as _ from 'lodash';


class DashboardScreen extends Component {
    constructor(props) {
      super(props);
      this.state = {
        active:2,
        fetching:false,
        requested:[],
        accepted:[],
      }
      this.getAllRelatedTasks = this.getAllRelatedTasks.bind(this);
    }

    componentDidMount(){
      this.setState({fetching:true});
      getAllServices().then(services =>
      {
        this.setState({services});
        this.getAllRelatedTasks();
      });
    }

    getAllRelatedTasks = () => {
      const {currentUser: {uid} = {}} = firebase.auth()
      
      var ref = firebase.database().ref('servicesRequests')
        
      ref.on('child_added', (snapshot) => {
        this.setState({fetching:false});
        var request = snapshot.val();
        if(request.clientId == uid ) this.setState({requested:[request].concat(this.state.requested)});
        else if(request.serverId == uid) this.setState({accepted:[request].concat(this.state.accepted)});
      });

      ref.on('child_removed', (snapshot) => {
          this.setState({
            requested: this.state.requested.filter(item => item.id !== snapshot.key),
            accepted: this.state.accepted.filter(item => item.id !== snapshot.key),
          });
      });

      ref.on('child_changed', (snapshot) => { 
        var request = snapshot.val();
        if(request.clientId == uid ) this.setState({requested:_.uniq([request].concat(this.state.requested))});
        else if(request.serverId == uid) this.setState({accepted:_.uniq([request].concat(this.state.accepted))});
      });
      /*if(uid)
      {
        this.setState({fetching: true})
        getAllRelatedTasks(uid).then(allRelatedTasks => {
          console.log('allofthem',allRelatedTasks);
          const {requestedTasks, acceptedTasks} = allRelatedTasks;
          this.setState({requested:requestedTasks,accepted:acceptedTasks,fetching:false});
        })
      }*/
    }
    
    openDetails = (item) =>
    {
      console.log(item);
      const {currentUser: {uid} = {}} = firebase.auth()
      if(uid)
      {
        this.setState({fetching: true})
        var oppUser = '', isClient = true;
        if(uid == item.clientId) oppUser = item.serverId;
        else if(uid == item.serverId)
        {
          isClient = false;
          oppUser = item.clientId;
        }
        getWhatsapp(oppUser).then(whatsapp => {
          let obj = {...item, ...{whatsapp, isClient}}
          this.setState({fetching:false})
          this.props.navigation.navigate('DashboardDetails',{item: obj})      
        })
      }
    }

    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const{serviceId, id, when, details} = item;
        const {services} = this.state
        var serviceTitle = '---';
        console.log(services);
        services.map(service => {
            if(service.id == serviceId)
            {
                serviceTitle = service.title;
            }
        });
        return (
          <TouchableOpacity key={id} onPress={() => this.openDetails(item)}>
            <View style={styles.rowItem}>
                <Text>{serviceTitle}</Text>
                <Text>{when}</Text>
            </View>
          </TouchableOpacity>
        )
    }

    render() {
        const {fetching, accepted, requested, active} = this.state
        return (
          <View style={styles.mainContainer}>
              <View style={styles.container}>
                <View style={styles.buttonContainer}>
                  <Button onPress={()=>{this.setState({active:1})}} title="Requested Tasks"/>
                </View>
                <View style={styles.buttonContainer}>
                  <Button onPress={()=>{this.setState({active:2})}} title="Accepted Tasks"/>
                </View>
              </View>
              {
                !fetching &&  <FlatList
                    style={styles.listContainer}
                    contentContainerStyle={styles.contentContainer}
                    data={(active == 1)?requested:accepted}
                    extraData={(active == 1)?requested:accepted}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
              }
              { 
                  fetching && <View style={styles.progressContainer}>
                      <ActivityIndicator color={'black'} size={'large'}/>
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