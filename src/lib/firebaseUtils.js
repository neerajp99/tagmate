import firebase from 'react-native-firebase'
import uuid from 'react-native-uuid'
import {Alert} from 'react-native'
import * as _ from 'lodash'

export const postServiceRequest = (serviceId) => new Promise((resolve, reject) => {
    try {
        console.log('inside posting Req')
        const {currentUser: {uid} = {}} = firebase.auth()
            firebaseReferences.SERVICES_REQUESTS.once('value', (snapshot) => {
            let servicesRequests = snapshot.val()
            if (_.isEmpty(servicesRequests)) {
                servicesRequests = {}
            }
            const id= uuid.v4()
            servicesRequests[id] = {id, serviceId, clientId: uid}
            firebaseReferences.SERVICES_REQUESTS.update(servicesRequests).then(res => {
                Alert.alert('succesfully requested.')
                resolve(true)
            })
        })
    } catch (e) {
        reject(e)
    }
})


export const firebaseReferences = {
    USERS: firebase.database().ref('/users'),
    SERVICES: firebase.database().ref('/services'),
    SERVICES_REQUESTS: firebase.database().ref('/servicesRequests')
}
