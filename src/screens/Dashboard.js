import React, {Component} from 'react';
import {View, Text, Button, StyleSheet, FlatList, ActivityIndicator} from 'react-native';
import {getAllRelatedTasks} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';

class DashboardScreen extends Component{
  state = {
    active:2,
    fetching:false,
    requested:[],
    accepted:[],
  }

  componentWillMount(){
    this.getAllRelatedTasks();
  }

  getAllRelatedTasks = () => {
    const {currentUser: {uid} = {}} = firebase.auth()
    if(uid)
    {
      this.setState({fetching: true})
      getAllRelatedTasks(uid).then(allRelatedTasks => {
        const {requestedTasks, acceptedTasks} = allRelatedTasks;
        console.log('requestedTasks',requestedTasks);
        console.log('acceptedTasks',acceptedTasks);

        this.setState({requested:requestedTasks,accepted:acceptedTasks,fetching:false});
      })
    }
  }
  renderItem = ({item: {serviceId, id, when, details} = {}}) => {
      var detailsAvailable = true;
      if(details == "" || typeof details == "undefined") detailsAvailable = false
      return (
          <View key={id} style={styles.rowItem}>
              <Text>{serviceId}</Text>
              <Text>{when}</Text>
              {
                  detailsAvailable &&
                  (
                      <Text>{details}</Text>
                  )
              }
          </View>
      )
  }

  render() {
        const {fetching, active, requested, accepted} = this.state
        return (
          <View>
            <View style={styles.container}>
               <View style={styles.buttonContainer}>
                <Button title="Requested Tasks"/>
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Accepted Tasks"/>
              </View>
            </View>
            <View style={styles.mainContainer}>
                <FlatList
                    style={styles.listContainer}
                    contentContainerStyle={styles.contentContainer}
                    data={(active == 1)?requested:accepted}
                    extraData={(active == 1)?requested:accepted}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={'black'} size={'large'}/>
                    </View>
                }
            </View>
          </View>
        )
    }

  /*render(){
  	var txt = "Chat Screen";
    // A quick fix to see if a whatsapp number was passed onto this screen.
    
    return(
      <View style={styles.container}>
         <View style={styles.buttonContainer}>
          <Button title="Requested Tasks"/>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Accepted Tasks"/>
        </View>
      </View>
    )
  }*/
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
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
});

export {DashboardScreen};
