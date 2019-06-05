import AsyncStorage from '@react-native-community/async-storage';
import * as _ from 'lodash'
import firebase from 'react-native-firebase'

const configure = (onTokenSuccess) => {
  firebase.messaging().hasPermission().then(enabled => {
    if (!enabled) {
      return firebase.messaging().requestPermission()
    }
  })
    .then(permissions => {
      console.warn({permissionsSucc: permissions})
    })
    .catch(err => {
      console.warn({perErr: err})
    })

  firebase.messaging().getToken()
    .then(token => {
      console.warn({token})
      if (onTokenSuccess && typeof onTokenSuccess === 'function') {
        onTokenSuccess(token)
      }
      onTokenRefresh(token)
    })
}
/*
const onNotification = (notification = {}) => {
  if (!_.isEmpty(notification) && notification._data && notification._data.type) {
    if (_.isEmpty(firebase.auth().currentUser)) {
      // todo: handle case where user is not logged In
      return
    }
    const {_data: {notifType, serviceId} = {}} = notification

    // todo: handle user is logged in and notification arrived.
  }
}*/
const onTokenRefresh = (token) => {
  console.log('Firebase FCM token received: ', token)
  if (token) {
    AsyncStorage.setItem('fcm_token', token)
  }
}

export default {configure, onTokenRefresh}
