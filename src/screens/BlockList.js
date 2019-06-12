import React, {Component} from 'react';
import {Card, ListItem, Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {View, ActivityIndicator, StyleSheet, Alert, Text, TextInput, Linking, FlatList, ScrollView, Dimensions, TouchableOpacity} from 'react-native'
import {getName, getLastName, getFullName, finalizeGuestList, getNetworkId} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {canRequestMore} from '../lib/firebaseUtils.js';
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')
let uid;

class BlockList extends Component {
  constructor(props) {
      super(props);
      this.state = {
          myTasks: [],
          blockList: [],
          disabledBtn: false,
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
      this.getUserBlockList();
  }

  componentWillUnmount()
  {
      this._isMounted = false;
  }

    // Home to all the listeners for the guest list object for this serviceRequest ID
    getUserBlockList = () => {
      if(this._isMounted)
      {
          var ref = firebase.database().ref(`users/${uid}/block/blocked`);
          console.log('inside getUserBlockList');

          ref.on('child_added', (snapshot) => {
            if(snapshot.val() != null){
              let blockedUser = snapshot.val();
              getFullName(blockedUser.id).then(fullName => {
                let blockedUserObj = {
                  id: blockedUser.id,
                  fullName: fullName
                };
                this.setState({blockList:[blockedUserObj].concat(this.state.blockList) , fetching: false});
              })
            }
        });

        //when a user is unblocked
        ref.on('child_removed', (snapshot) => {
          this.setState({blockList: this.state.blockList.filter(item => item.id !== snapshot.key)});
        });
      }

    }

    onUnblockPress = (id) => {
      getName(id).then(name => {
        Alert.alert(
          'Confirmation',
          `Are you sure you want to unblock ${name}`,
          [
            {text: 'Cancel', onPress: () => console.log('Block cancelled')},
            {text: 'Unblock', onPress: () => this.onUnblockConfirm(id, name)}
          ]
        );
      })
    }

    onUnblockConfirm = (id, name) => {
      let user = firebase.auth().currentUser;
      if (user != null) {
        let selfUid = user.uid;
        const unblockUser = firebase.functions().httpsCallable('unblockUser');
        unblockUser({selfUid: selfUid, toUnblockUid: id })
        .then(({ data }) => {
          console.log('[Client] Report Success')
          alert(`${name} has been unblocked`)
        })
        .catch(HttpsError => {
            console.log(HttpsError.code); // invalid-argument
        })
      } else {
        alert('Please signin')
        this.props.navigation.navigate('Login')
      }
    }


    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const {id, fullName} = item;

        return (
          <View>
          <Card>
            <View style={styles.guestContainer}>

            <Text style={adourStyle.listItemTextBold}>{fullName}</Text>

            <View style={styles.buttonsContainer}>
              <View>
                <TouchableOpacity style={adourStyle.redButton} onPress={() => { this.onUnblockPress(id) }}>
                  <Text style={adourStyle.textWhite}>Unblock</Text>
                </TouchableOpacity>
              </View>
            </View>

            </View>
          </Card>
            </View>
        )
    }

    render() {
      const {fetching, blockList} = this.state
        return (
          <View style={{flex: 2, marginBottom: 8}}>
          <ScrollView>
            <View style={styles.mainContainer}>
                {(blockList.length == 0) && <Text style={adourStyle.defaultText}>No blocked users.</Text>}
                {(blockList.length != 0) && <FlatList
                    data={blockList}
                    extraData={blockList}
                    renderItem={this.renderItem}
                    keyExtractor={(blockList, index) => blockList.id}
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

export default BlockList;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    guestContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 2,
      flex: 2
    },
    buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginBottom: 2,
    flex: 2
    },
})
