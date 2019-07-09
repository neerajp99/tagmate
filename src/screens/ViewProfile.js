import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking, Image, Alert, ScrollView} from 'react-native';
import { ListItem, Card, Divider, Avatar, Icon as IconElements } from 'react-native-elements';
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import ActionSheet from 'react-native-actionsheet'
import AddDetails from './auth/AddDetails';
import {getCoins, getBio, getFullName, getAvatar, getName, listenForChange, getBlockedList} from '../lib/firebaseUtils.js';
import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_ONE} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')
const PLACEHOLDER_AVATAR = "https://firebasestorage.googleapis.com/v0/b/chillmate-241a3.appspot.com/o/general%2Favatar.jpg?alt=media&token=4dcdfa81-fea1-4106-9306-26d67f55d62c";


class ViewProfile extends Component{

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      profileUid:this.props.navigation.state.params.profileUid,
      coins: 'Loading...',
      displayName: '_____ _____',
      bio: '_____ _____ _____ ___ ______',
      photoURL: PLACEHOLDER_AVATAR,
      selectedOption: '',
      blocked: false, //if blocked is false the profile is displayed, if it is true, it means this user is blocked and hence we will not show this profile
    }; // Message to show while Adour coins are being loaded

  }

  componentDidMount(){
    this._isMounted = true;
    //Fetching name and photo URL
    const {profileUid} = this.state;
    console.log('profileUid: ', profileUid)

    // If this profileUid user is in the user's blocked list, do not show the page
    let user = firebase.auth().currentUser;
    if (user != null) {
      let uid = user.uid;
      getBlockedList(uid).then(blockedList => {
        if(blockedList.includes(profileUid)){
          if(this._isMounted) this.setState({blocked: true})
        }
      })
    }

    getFullName(profileUid).then(displayName => {
      getBio(profileUid).then(bio => {
        getAvatar(profileUid).then(photoURL => {
          getCoins(profileUid).then(coins => {
            if(this._isMounted) this.setState({displayName, bio, coins, photoURL, loading: false});
          })
        })
      })
    })



  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  showActionSheet = () => {
    this.ActionSheet.show()
  }

  onBlockPress = () => {
    getName(this.state.profileUid).then(name => {
      Alert.alert(
        'Confirmation',
        `If you block ${name}, both you and ${name} won\'t be able to see each other\'s posts in the future. Please confirm.`,
        [
          {text: 'Cancel', onPress: () => console.log('Block cancelled')},
          {text: 'Block', onPress: () => this.onBlockConfirm(name)}
        ]
      );
    })
  }

  onBlockConfirm = (name) => {
    const {profileUid} = this.state;
    let user = firebase.auth().currentUser;
    if (user != null) {
      let selfUid = user.uid;
      const blockUser = firebase.functions().httpsCallable('blockUser');
      blockUser({selfUid: selfUid, toBlockUid: profileUid })
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

  onReportPress = () => {
    Alert.alert(
    'Confirmation',
    'You may report this profile if you think it is inappropriate or it violates our Terms of Service',
    [
      {text: 'Cancel', onPress: () => console.log('Report Revoked')},
      {text: 'Report', onPress: () => this.onReportConfirm()}
    ]
  );
  }

  onReportConfirm = () => {
    const {profileUid} = this.state;
    let user = firebase.auth().currentUser;
    if (user != null) {
      let selfUid = user.uid;
      const report = firebase.functions().httpsCallable('report');
      report({uid: selfUid, reportID: profileUid, contentType: 'user' , reportType: 'abuse'})
      .then(({ data }) => {
        console.log('[Client] Report Success')
        alert('Thank you for reporting. Our team will look into it and take appropriate actions. We will contact you if we need your input. Please block this user if you do not want to see their posts or do not want to be seen by them.')
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

  render(){
    return(
      <ScrollView>
      <View style={styles.backgroundContainer}>
            <Card>
                {this.state.blocked? <Text style={adourStyle.defaultText}>Sorry, there was a problem displaying this profile.</Text> :

                <View>
                <View style={{alignItems: 'flex-end', justifyContent: 'flex-end'}} >
                  <IconElements
                    name="dots-horizontal"
                    type="material-community"
                    color={BRAND_COLOR_TWO}
                    onPress={this.showActionSheet}
                    raised
                    />
                    <ActionSheet
                      ref={o => this.ActionSheet = o}
                      options={['Report Abuse', 'Block', 'Cancel']}
                      cancelButtonIndex={2}
                      destructiveButtonIndex={1}
                      onPress={(index) => {
                        if(index === 1){
                          this.onBlockPress()
                        }else if (index === 0){
                          this.onReportPress()
                        }
                    }}
                    />

                </View>
                <View style={{alignItems: 'center', justifyContent: 'center', marginBottom: 8}} >
                <Avatar
                size="xlarge"
                rounded
                onPress={() => this.props.navigation.navigate('ViewImage',{imgURL: this.state.photoURL})}
                source={{uri: this.state.photoURL}}
                activeOpacity={0.7}
                />
                </View>
              <Text style={adourStyle.titleTextCenter}>{this.state.displayName}</Text>
              <View style={{flex:2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <IconElements name="star-border" type="material" color='grey' />
              <Text style={adourStyle.reputationText}> {this.state.coins}</Text>
              </View>

              <View style={{marginTop: 15}}>
              <Divider style={{marginBottom: 4}} />
                <Text style={adourStyle.cardTitleSmall}>Bio</Text>
              <Divider style={{marginTop: 4}} />
                <Text style={adourStyle.defaultText}>{this.state.bio}</Text>
              </View>

              </View>
            }
            </Card>

        <View style={{marginTop: 25}} />
      </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8
  },
  btn: {
    width: WIDTH - 20,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'darkgrey',
    justifyContent: 'center',
    marginTop: 20
  },
  titleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'left'
  },
  subtitleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 20,
    fontWeight: '200',
    textAlign: 'left'
  },
  btnText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    textAlign: 'center'
  }
})

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    color: 'black',

  },
  inputAndroid: {
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: 'grey',
    borderRadius: 8,
    color: 'black',
  },
  iconContainer: {
              top: 10,
              right: 12,
            },
});

export {ViewProfile};
