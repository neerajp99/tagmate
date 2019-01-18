import React, {Component} from 'react'
import {View, Text, ActivityIndicator, AsyncStorage, StyleSheet, ImageBackground, Image} from 'react-native'
import firebase from 'react-native-firebase';
import Notification from '../lib/Notification'
import connect from "react-redux/es/connect/connect";
import {fetchAllServices, setDeviceToken, submitUserServices} from "../actions";
import bgImage from '../img/background.jpg'
import logo from '../img/logo.png'
import {adourStyle} from './style/AdourStyle'
import * as _ from 'lodash'

class Loading extends Component {
    componentWillMount(){
        firebase.database().goOnline()
        const {fetchAllServices} = this.props
        console.log('fetching all services in loading screen.')
        fetchAllServices()
    }
    async componentDidMount() {
        var stay = false;
        await AsyncStorage.getItem('56', (err, result) => {
          console.log("INSIDE");
          if (err) {
          } else {
            if(result == null) {
                stay = true;
                this.props.navigation.navigate('OnboardingSplash')
             }else {
              console.log("result", result);
            }
          }
        });

        //console.log(aaa);

        AsyncStorage.setItem('56', JSON.stringify({"value":"true"}), (err,result) => {
            console.log("error",err,"result",result);
        });


        const {setDeviceToken} = this.props
        firebase.auth().onAuthStateChanged(user => {
            if(!stay)
            {
                if(!user) this.props.navigation.navigate('Login');
                else
                {
                    const {currentUser: {uid} = {}} = firebase.auth();
                    firebase.database().ref(`/users/${uid}`).once('value', (snapshot) =>
                    {
                        var vals = snapshot.val();
                        if(vals != null){
                            if((vals.whatsapp || "0").length != 10 || (vals.services || []).length == 0) this.props.navigation.navigate('Onboarding');
                            else this.props.navigation.navigate('MainStack');
                        }
                        else{
                            this.props.navigation.navigate('Onboarding');
                        }
                    })
                }
            }
            else stay = false;
            //this.props.navigation.navigate(user ? 'MainStack' : 'SignUp')
        })
        // configure push notification capability & get deviceToken
        Notification.configure((token) => {
            // console.log('token: ' + token)
            setDeviceToken(token)
        })

        //listener to listen token refresh
        this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(token => {
            Notification.onTokenRefresh(token)
            setDeviceToken(token)
        })

        //listener to listen for push notifications
        this.notificationListener = firebase.notifications().onNotification((notification) => {
            this.handlePushNotification(notification, false)
        })

        //called when a notification is opened.
        this.notificationOpenListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
            this.handlePushNotification(notificationOpen.notification, false)
        })

        // in case app was closed and opened by
        const notificationOpen = await firebase.notifications().getInitialNotification()
        if (notificationOpen) {
            // App was opened by a notification
            // Get the action triggered by the notification being opened
            const action = notificationOpen.action
            // Get information about the notification that was opened
            this.handlePushNotification(notificationOpen.notification, true)
        }
    }

    handlePushNotification = (notification, wasAppClosed) => {
        // Process your notification as required
        setTimeout(() => {
            const {authToken = ''} = this.props
            const {currentUser} = firebase.auth()
            const {notifType} = notification
            if(wasAppClosed && !_.isEmpty(currentUser)) {
                if(notifType == 'SERVICE_REQUEST') this.props.navigation.navigate('Tasks')
                else if(notifType == 'FOUND_ACCEPTOR') this.props.navigation.navigate('Chat', { whatsapp: notification.whatsapp })
                //const {_data: {notifType, serviceId} = {}} = notification
            }
            if(!_.isEmpty(currentUser) && notifType == 'FOUND_ACCEPTOR') this.props.navigation.navigate('Chat', { whatsapp: notification.whatsapp })
            //const {_data = {}} = notification

            //todo: handle here what to do with push Notif when app is opened.
            // handlePushNotification(_data)
        }, 1000)
    }
    componentWillUnmount () {
        // this.onTokenRefreshListener()
        // this.notificationListener()
        // this.notificationOpenListener()
    }

    render() {
        return (
          <ImageBackground source={bgImage} style={styles.backgroundContainer}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
              <Text style={adourStyle.logoSubtitle}> Do more for others. Get more done. </Text>
            </View>
            <View style={{marginTop: 10, marginBottom: 10}}>
                <ActivityIndicator size="large" color="white"/>
            </View>
          </ImageBackground>
        )
    }
}

export default connect(null, {setDeviceToken, fetchAllServices}) (Loading);

const styles = StyleSheet.create({
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
  backgroundContainer: {
    flex: 1,
    width: null,
    height: null,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoContainer: {
    alignItems: 'center'
  },
  logo: {
    height: 47,
    width: 150,
    marginBottom: 8
  },
})
