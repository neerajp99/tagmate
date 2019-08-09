import React, {Component} from 'react'
import {View, Text, ActivityIndicator, StyleSheet, ImageBackground, Image} from 'react-native'
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import Notification from '../lib/Notification'
import {saveDeviceToken} from "../lib/firebaseUtils"
import connect from "react-redux/es/connect/connect";
import {fetchAllServices, submitUserServices} from "../actions";
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

      //We only need to check if it's user's first time if user is not signed in
      AsyncStorage.getItem("alreadyLaunched").then(value => {
            if(value == null){
                 AsyncStorage.setItem('alreadyLaunched', "true"); // No need to wait for `setItem` to finish, although you might want to handle errors
                 this.props.navigation.navigate('OnboardingSplash');
            }
            else{
                 console.log('Not showing onboarding since this is not the first launch')
            }}) // Add some error handling, also you can simply do this.setState({fistLaunch: value == null})


        //const {setDeviceToken} = this.props
        let {currentUser} = await firebase.auth();
        // If the user exists and does not have to go to OnboardingSplash:
        //SEND THE USER DIRECTLY WITHOUT CHECKING EMAIL AGAIN

        //If firstName is null that means the user tried to sign in using non university ID and Google could not derive firstName
        //Therefore, redirect the user to the Login screen
        let uid = currentUser.uid;
        firebase.database().ref(`/users/${uid}/firstName`).once('value', (snapshot) => {
            let firstName = snapshot.val();
            if(firstName == null){
              this.props.navigation.navigate('Login');
            } else {
              this.props.navigation.navigate('MainStack');
          }
        });

        //IF you want to check the user's email again and verify its university affiliation then uncomment the below code
        /*
        if(currentUser)
        {
                    firebase.auth().onAuthStateChanged(user => {
                    //Remove after testing
                    let uid = currentUser.uid;
                    let allow = (currentUser.email.slice(-14) === '@ashoka.edu.in');
                    if(!allow)
                    {
                        this.props.navigation.navigate('Login');
                    }
                    else
                    {
                      this.props.navigation.navigate('MainStack');
                      // IF YOU WANT TO CHECK IF THE USER HAS FILLED CERTAIN PROFILE DETAILS BEFORE ALLOWING ACCESS INTO THE APP ENABLE THIS
                      //DISABLE C START
                        firebase.database().ref(`/users/${uid}`).once('value', (snapshot) =>
                        {
                            let vals = snapshot.val();
                            if(vals != null){
                                if( (vals.gender || []).length == 0) this.props.navigation.navigate('Onboarding');
                                else {
                                  this.props.navigation.navigate('MainStack');
                                }
                            }
                            else{
                                //this.populateUserServices();
                                this.props.navigation.navigate('MainStack');
                            }
                        })
                        //DISABLE C END
                    }

            //this.props.navigation.navigate(user ? 'MainStack' : 'SignUp')
        })
      } else {
        //Else do the following if the user is not signed In
        this.props.navigation.navigate('Login');
      }
      DISABLE B END */



      // configure push notification capability & get deviceToken
      Notification.configure((token) => {
        if(currentUser) saveDeviceToken(currentUser.uid, token)
      })

      //listener to listen token refresh
      this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(token => {
          Notification.onTokenRefresh(token)
          if(currentUser) saveDeviceToken(currentUser.uid, token)
      })

      //listener to listen for push notifications
      this.notificationListener = firebase.notifications().onNotification((notification) => {
          this.handlePushNotification(notification, false, currentUser)
      })

      //called when a notification is opened.
      this.notificationOpenListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
          this.handlePushNotification(notificationOpen.notification, false, currentUser)
      })

      // in case app was closed and opened by
      const notificationOpen = await firebase.notifications().getInitialNotification()
      if (notificationOpen) {
          // App was opened by a notification
          // Get the action triggered by the notification being opened
          const action = notificationOpen.action
          // Get information about the notification that was opened
          this.handlePushNotification(notificationOpen.notification, true, currentUser)
      }
    }

    populateUserServices = () => {
      let servicesCount = 0
      let services = []
      console.log('Inside populate user services in Loading js')
      const {currentUser} = firebase.auth();
      //userRef.child(`services`).set(myServices);

      //Get the count of all available services
      firebase.database().ref('/services').once('value', function(snapshot) {
         servicesCount = snapshot.numChildren();
         for(i = 1; i<servicesCount+1; i++){
           services.push('service' + i)
         }
         console.log('Populating new user object with all services by default')
         var ref = firebase.database().ref(`/users/${currentUser.uid}`);
         ref.child(`services`).set(services);
       },
       function(error) {
        // The callback failed.
        console.error(error);
    });
  }


    handlePushNotification = (notification, wasAppClosed, currentUser) => {
        // Process your notification as required
        setTimeout(() => {
            const {authToken = ''} = this.props
            const {notifType} = notification
            if(wasAppClosed && !_.isEmpty(currentUser)) {
                if(notifType == 'SERVICE_REQUEST') this.props.navigation.navigate('Home')
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
              {/* <Text style={adourStyle.logoSubtitle}> Do more for others. Get more done. </Text> */}
            </View>
            <View style={{marginTop: 10, marginBottom: 10}}>
                <ActivityIndicator size="large" color="white"/>
            </View>
          </ImageBackground>
        )
    }
}

export default connect(null, {fetchAllServices}) (Loading);

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
    height: 61,
    width: 250,
    marginBottom: 8
  },
})
