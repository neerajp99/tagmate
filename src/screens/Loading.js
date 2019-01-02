import React, {Component} from 'react'
import {View, Text, ActivityIndicator} from 'react-native'
import firebase from 'react-native-firebase';
import Notification from '../lib/Notification'
import connect from "react-redux/es/connect/connect";
import {fetchAllServices, setDeviceToken, submitUserServices} from "../actions";
import * as _ from 'lodash'

class Loading extends Component {
    componentWillMount(){
        firebase.database().goOnline()
        const {fetchAllServices} = this.props
        console.log('fetching all services in loading screen.')
        fetchAllServices()
    }
    async componentDidMount() {
        const {setDeviceToken} = this.props
        firebase.auth().onAuthStateChanged(user => {
            this.props.navigation.navigate(user ? 'MainStack' : 'SignUp')
        })
        // configure push notification capability & get deviceToken
        Notification.configure((token) => {
            console.log('token: ' + token)
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
            <View>
                <Text>Loading</Text>
                <ActivityIndicator size="large"/>
            </View>
        )
    }
}

export default connect(null, {setDeviceToken, fetchAllServices}) (Loading);
