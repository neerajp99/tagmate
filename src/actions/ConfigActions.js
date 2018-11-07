import firebase from 'react-native-firebase';
import {SUBMIT_SERVICES} from './types';
import * as _ from 'lodash'

{/* Function parameters should be scalable, not hardcoded like this. */
}


export const setDeviceToken = (deviceToken) => {
    console.log('insideSetDeviceToken: ' + deviceToken)
    const {currentUser} = firebase.auth();

    return (dispatch) => {
        const devTokensRef = firebase.database().ref(`/users/${currentUser.uid}/deviceTokens`)
        devTokensRef.once('value', async (snapshot) => {
            let deviceTokens = snapshot.val()
            let notFound = false
            if (!Array.isArray(deviceTokens)) {
                deviceTokens = []
            }
            if (!_.includes(deviceTokens, deviceToken)) {
                notFound = true
                deviceTokens.push(deviceToken)
            }
            if (notFound) {
                devTokensRef.set(deviceTokens).then(res => res)
            }
        })
    };
}
