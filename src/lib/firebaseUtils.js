import firebase from 'react-native-firebase'
import uuid from 'react-native-uuid'
import {Alert} from 'react-native'
import * as _ from 'lodash'
/*
* method to post the service request.
* */
export const postServiceRequest = ({serviceId: serviceId, when: when, details: details}) => new Promise((resolve, reject) => {
    try {
        console.log('inside posting Req')
        const {currentUser: {uid} = {}} = firebase.auth()
        firebaseReferences.SERVICES_REQUESTS.once('value', (snapshot) => {
            let servicesRequests = snapshot.val()
            if (_.isEmpty(servicesRequests)) {
                servicesRequests = {}
            }
            const id = uuid.v4()
            servicesRequests[id] = {id, serviceId, clientId: uid, when: when, details: details, status: 0}
            firebaseReferences.SERVICES_REQUESTS.update(servicesRequests).then(res => {
                Alert.alert('Service requested.')
                resolve(true)
            })
        })
    } catch (e) {
        reject(e)
    }
})

export const creditCoins = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}`).update({coins:3}).then(res=>{resolve(true)});
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
                        if (_.includes(myServices, allRequests[key].serviceId) && !_.includes(rejectedTasks, allRequests[key].id) && allRequests[key].clientId !== userId && typeof allRequests[key].status != "undefined" && allRequests[key].status == 0) {
                                
                                myTasks.push(allRequests[key])
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


export const getAllRelatedTasks = (userId) => new Promise((resolve, reject) => {
    try {
            // Fetching all tasks
            firebase.database().ref('servicesRequests').once('value', (snapshot) => {
                let requestedTasks = []
                let acceptedTasks = []
                const allRequests = snapshot.val() || {}
                const keys = Object.keys(allRequests)
                for (let key of keys)
                {
                    console.log("USERID: ",userId);
                    console.log(allRequests[key].clientId,allRequests[key].serverId);

                    if(allRequests[key].serverId == userId) acceptedTasks.push(allRequests[key]) 
                    else if(allRequests[key].clientId == userId) requestedTasks.push(allRequests[key])
                }
                let allRelatedTasks = {requestedTasks, acceptedTasks}
                resolve(allRelatedTasks)
                return
            })
        } catch (e) {
            reject(e)
        }
})

export const canRequestMore = (userId) => new Promise((resolve, reject) => {
    try {
            // Fetching all tasks
            firebase.database().ref('servicesRequests').once('value', (snapshot) => {
                const allRequests = snapshot.val() || {}
                const keys = Object.keys(allRequests)
                var count = 0;
                for (let key of keys)
                {
                    if(allRequests[key].clientId == userId) count++;
                }
                getCoins(userId).then(coins => {
                    console.log('coins',coins,'reqs',count);
                    if(count >= coins) resolve(false);
                    else resolve(true);
                    return;
                });
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

export const getAllServices = () => new Promise((resolve, reject) => {
    try {
            firebase.database().ref('/services').once('value', (snapshot) => {
                const servicesObj = snapshot.val()
                const keys = !_.isEmpty(servicesObj) ? Object.keys(servicesObj) : []
                let finalServices = []
                for(const key of keys)
                {
                    finalServices.push(servicesObj[key])
                }
                resolve(finalServices)
            })
    } catch (e) {
        reject(e)
    }
})

export const getRelatedServices = (userId) => new Promise((resolve, reject) => {
    try {
            getMyServices(userId).then(myServices =>
            {
                getAllServices().then(allServices =>
                {
                    resolve({myServices, allServices})
                })
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
        ref.update({serverId:userId,status:1});       
        // Now returning the Whatsapp number of requester (client)
        ref.child(`clientId`).once("value", function(snapshot) {
            resolve(getWhatsapp(snapshot.val()));
        });
    } catch (e) {
        reject(e)
    }
})

export const markRequestDone = (id) => new Promise((resolve, reject) => {
    try {
        var ref = firebase.database().ref(`/servicesRequests/${id}`);
        ref.update({status:2});
        ref.once("value", function(snapshot) {
            const {clientId, serverId} = snapshot.val();
            firebase.database().ref(`/users/${clientId}/coins`).transaction(function(coins){
              return (coins || 0) - 1;
            });
            firebase.database().ref(`/users/${serverId}/coins`).transaction(function(coins){
              return (coins || 0) + 1;
            });
            resolve(true);
        });
    } catch (e) {
        reject(e)
    }
})

export const markRequestCancelled = (id) => new Promise((resolve, reject) => {
    try {
        var ref = firebase.database().ref(`/servicesRequests/${id}`);
        ref.update({status:3});
        resolve(true);
    } catch (e) {
        reject(e)
    }
})

export const getWhatsapp = (userId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        var wRef = firebase.database().ref(`/users/${userId}/whatsapp`);
        wRef.once("value", function(whatsapp){resolve(whatsapp.val());})
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

export const getCoins = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}/coins`).once("value", function(coins){resolve(coins.val() || 0);})
    } catch (e) {
        reject(e)
    }
})


/*
* kept firebase reference in one place
* */
export const firebaseReferences = {
    USERS: firebase.database().ref('/users'),
    SERVICES: firebase.database().ref('/services'),
    SERVICES_REQUESTS: firebase.database().ref('/servicesRequests')
}
