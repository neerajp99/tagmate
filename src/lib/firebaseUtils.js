import firebase from 'react-native-firebase'
import uuid from 'react-native-uuid'
import {Alert} from 'react-native'
import * as _ from 'lodash'
/*
* method to post the service request.
* */
export const postServiceRequest = (serviceId) => new Promise((resolve, reject) => {
    try {
        console.log('inside posting Req')
        const {currentUser: {uid} = {}} = firebase.auth()
        firebaseReferences.SERVICES_REQUESTS.once('value', (snapshot) => {
            let servicesRequests = snapshot.val()
            if (_.isEmpty(servicesRequests)) {
                servicesRequests = {}
            }
            const id = uuid.v4()
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

/*
* method toget all the task that user with userId can perform
* */
export const getMyTasks = (userId) => new Promise((resolve, reject) => {
    try {
        getMyServices(userId).then(myServices => {
            console.log('myServices: ', myServices)
            if (!Array.isArray(myServices) || !myServices.length) {
                resolve([])
                return
            }
            // Fetching all tasks
            firebase.database().ref('servicesRequests').once('value', (snapshot) => {
                // Fetching all tasks rejected by user {userId}
                firebase.database().ref(`/users/${userId}/rejectedTasks`).once('value', (snapshotb) => {
                    let myTasks = []
                    const allRequests = snapshot.val() || {}
                    console.log('allRequests: ', allRequests)
                    const keys = Object.keys(allRequests)
                    const rejectedTasks = snapshotb.val() || {}
                    for (let key of keys) {
                    // Generating a list of only those tasks which user {userId} can perform, has not rejected, did not create himself and still are available to be accepted.
                        if (_.includes(myServices, allRequests[key].serviceId) && !_.includes(rejectedTasks, allRequests[key].id) && allRequests[key].clientId !== userId && typeof allRequests[key].serverId == "undefined") {
                                myTasks.push(allRequests[key])
                            }
                    }
                    }
                    console.log('myTasks: ', myTasks)
                    resolve(myTasks)
                    return
                })
        })
        })
    } catch (e) {
        reject(e)
    }
})

/*
* get all the services that user with userId can perform
* */
export const getMyServices = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`users/${userId}`).once('value', (snapshot) => {
            const user = snapshot.val() || []
            resolve(user.services || [])
        })
    } catch (e) {
        reject(e)
    }
})

// Check if given task has already been accepted by someone.
export const serverExists = (serviceId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/servicesRequests/${serviceId}/serverId`).once('value', (snapshot) => {
            console.log(snapshot.exists()+" <-- ");
            resolve(snapshot.exists())
        })
    } catch (e) {
        reject(e)
    }
})

// Assign user {userId} as acceptor of task {serviceId} and return whatsapp number of requester.
export const addServer = (userId, serviceId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        var ref = firebase.database().ref(`/servicesRequests/${serviceId}`);
        ref.child(`serverId`).set(userId);        
        // Now returning the Whatsapp number of requester (client)
        ref.child(`clientId`).once("value", function(snapshot) {
            console.log("Client Id: "+snapshot.val());
            var wRef = firebase.database().ref(`/users/${snapshot.val()}/whatsapp`);
            wRef.once("value", function(whatsapp)
            {
                console.log(whatsapp.val());
                resolve(whatsapp.val());
            })
        });
    } catch (e) {
        reject(e)
    }
})

// To note in database that user {userId} has rejected task {serviceId}
export const appendRejectedTask = (userId, serviceId) => new Promise((resolve, reject) => {
    try {
        resolve(firebase.database().ref(`/users/${userId}/rejectedTasks`).push(serviceId));
    } catch (e) {
        reject(e)
    }
})

/*export const addServer = async (uid,serviceId) => {
    const {currentUser} = firebase.auth();
    var serviceRef = firebase.database().ref(`/servicesRequests/${serviceId}/serverId`);
    const valueSnapshot = await serviceRef.once('value');
    if(valueSnapshot.exists())
    {
        console.log("Already exists. Returning.");
        return;
    }
    serviceRef.set(uid)
    .then(() => {
        console.log('firebase submitted');
        this.props.navigation.navigate('MainStack');
    });
}*/

/*
* kept firebase reference in one place
* */
export const firebaseReferences = {
    USERS: firebase.database().ref('/users'),
    SERVICES: firebase.database().ref('/services'),
    SERVICES_REQUESTS: firebase.database().ref('/servicesRequests')
}
