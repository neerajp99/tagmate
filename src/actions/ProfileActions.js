import firebase from 'react-native-firebase';
import {
    SUBMIT_SERVICES, FETCH_ALL_SERVICES, FETCH_ALL_SERVICES_SUCCESS,
    FETCH_ALL_SERVICES_FAILURE, LOGIN_USER
} from './types';
import * as _ from 'lodash'

{/* Function parameters should be scalable, not hardcoded like this. */
}

export const submitUserUpdates = (myServices, whatsapp) => {
    const {currentUser} = firebase.auth();
    return () => {
        var ref = firebase.database().ref(`/users/${currentUser.uid}`);
        // Updating services offered and whatsapp number:
        ref.child(`services`).set(myServices);
        ref.child(`whatsapp`).set(whatsapp);
    };
}

export const fetchAllServices = () => {
    return (dispatch) => {
        try {
            const servicesRef = firebase.database().ref('/services')
            servicesRef.once('value', (snapshot) => {
                const servicesObj = snapshot.val()
                const keys = !_.isEmpty(servicesObj) ? Object.keys(servicesObj) : []
                let finalServices = []
                for(const key of keys)
                {
                    finalServices.push(servicesObj[key])
                }
                dispatch({
                    type:FETCH_ALL_SERVICES_SUCCESS,
                    payload: finalServices
                });
            })
        } catch (e) {
            dispatch({
                type:FETCH_ALL_SERVICES_FAILURE,
                payload: e.message
            });
        }
    };
}
