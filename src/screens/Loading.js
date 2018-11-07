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
        Notification.configure((token) => {
            console.log('token: ' + token)
            setDeviceToken(token)
        })
        this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(token => {
            Notification.onTokenRefresh(token)
            setDeviceToken(token)
        })
        this.notificationListener = firebase.notifications().onNotification((notification) => {
            this.handlePushNotification(notification, false)
        })
        this.notificationOpenListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
            this.handlePushNotification(notificationOpen.notification, false)
        })
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
            if (wasAppClosed && !_.isEmpty(currentUser)) {
                const {_data: {notifType, serviceId} = {}} = notification
                this.props.navigation.navigate('Tasks')
            }
            const {_data = {}} = notification
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
