import React, {Component} from 'react';
import ReduxThunk from 'redux-thunk';
import reducers from './reducers';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';
import {RootNav} from './Router';
import * as _ from 'lodash'
import firebase from 'react-native-firebase';
import { NavigationActions } from 'react-navigation';


class App extends Component {
    async componentDidMount()
    {
        // Listeners for push notifications below:

        // When app was open
        this.notificationOpenListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
            this.handlePushNotification(notificationOpen.notification, false)
        })

        // in case app was closed and opened by
        const notificationOpen = await firebase.notifications().getInitialNotification()
        if (notificationOpen) {
            const action = notificationOpen.action
            // Get information about the notification that was opened
            this.handlePushNotification(notificationOpen.notification, true)
        }
	}

	handlePushNotification = (notification, wasAppClosed) => {
		var notifData = notification._data;
        setTimeout(() => {
            const {authToken = ''} = this.props
            const {currentUser} = firebase.auth()
            const {notifType, whatsapp} = notifData
            if(!_.isEmpty(currentUser)) {
                if(notifType == 'SERVICE_REQUEST')
                {
                	this.navigator.dispatch(
        				NavigationActions.navigate({ routeName: 'Tasks' })
      					);
                }
                else if(notifType == 'FOUND_ACCEPTOR') this.navigator.dispatch(
        				NavigationActions.navigate({ routeName: 'Chat', params: {whatsapp: whatsapp} })
      					);
            }
        }, 1000)
    }

	  render(){
	    return(
	      <Provider store={createStore(reducers, {}, applyMiddleware(ReduxThunk))}>
	         <RootNav ref={nav => { this.navigator = nav; }} />
	        { /* <AddDetails /> */}
	      </Provider>
	    )
  }
}

export default App;
