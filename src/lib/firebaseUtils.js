import firebase from 'react-native-firebase'
import uuid from 'react-native-uuid'
import {Alert} from 'react-native'
import * as _ from 'lodash'
/*
* method to post the service request.
* */
export const postServiceRequest = ({serviceId: serviceId, when: when, details: details, anonymous: anonymous}) => new Promise((resolve, reject) => {
    try {
        console.log('inside posting Req')
        const {currentUser: {uid} = {}} = firebase.auth()
          getFullName(uid).then(fullName =>{
            firebaseReferences.SERVICES_REQUESTS.once('value', (snapshot) => {
                let servicesRequests = snapshot.val()
                if (_.isEmpty(servicesRequests)) {
                    servicesRequests = {}
                }
                const id = uuid.v4()
                servicesRequests[id] = {
                  id,
                  serviceId,
                  clientId: uid,
                  when: when,
                  details: details,
                  anonymous: anonymous,
                  status: 0,
                  created_at:firebase.database.ServerValue.TIMESTAMP,
                  hostName: fullName,
                }
                firebaseReferences.SERVICES_REQUESTS.update(servicesRequests).then(res => {
                    Alert.alert('Posted Successfully. You can find it on your Dashboard.')
                    resolve(true)
                })
            })
          })
    } catch (e) {
        reject(e)
    }
})

/*
* method to create a custom service
* */
export const createCustomService = (customTitle) => new Promise((resolve, reject) => {
    try {
      serviceRef = firebase.database().ref(`/services`);

      serviceRef.once('value', (snapshot) => {
          servicesCount = snapshot.numChildren();
          newServiceId = 'service' + (servicesCount+1);
          serviceRef.child(newServiceId).set({
            description: customTitle,
            title: customTitle,
            id: newServiceId,
            img: 'http://chillmateapp.com/assets/item_img/custom.jpg',
            icon: 'av-timer'
          })
        });
        resolve(newServiceId);
    } catch (e) {
        reject(e)
    }
})


// Expects a user object ID in parameters.
// Updates the Adour coin balance of the corresponding user to 3.
export const creditCoins = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}`).update({coins:5}).then(res=>{resolve(true)});
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

// Expects a user object ID in parameters.
// Resolves all tasks the user is involved in as
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

// Expects user ID in parameter
// Checks whether user can create more service requests
export const canRequestMore = (userId) => new Promise((resolve, reject) => {
    try {
            // Fetching all tasks
            firebase.database().ref('servicesRequests').once('value', (snapshot) => {
                const allRequests = snapshot.val() || {}
                const keys = Object.keys(allRequests)
                var count = 0;
                for (let key of keys)
                {
                    if(allRequests[key].clientId == userId && (allRequests[key].status == 0 || allRequests[key].status == 1)) count++;
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

// Expects user ID in parameter
// Pass on user's related services and all services
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

// Check if given task has already been accepted by someone returns boolean
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

// gets the list of all acceptors who have accepted this particular activity with serviceId
export const getAcceptors = (serviceId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/servicesRequests/${serviceId}/acceptorIds`).once('value', (snapshot) => {
            const acceptorIds = snapshot.val() || []
            resolve(acceptorIds || [])
        })
    } catch (e) {
        reject(e)
    }
})

// gets the list of all acceptors who have accepted this particular activity with serviceId
export const getServiceItem = (serviceId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/services/${serviceId}`).once('value', (snapshot) => {
            const serviceItem = snapshot.val() || []
            resolve(serviceItem || [])
        })
    } catch (e) {
        reject(e)
    }
})

// has this user already accepted this activity? returns a boolean if yes
//Checks if uid exists in the acceptorIds array of serviceId servicesRequests
export const alreadyAccepted = (uid, serviceId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/servicesRequests/${serviceId}/acceptorIds`).once('value', (snapshot) => {
            resolve(snapshot.child(uid).exists());
        })
    } catch (e) {
        reject(e)
    }
})

// expects an acceptors UID and task ID. Checks if the host has confirmed this acceptor, if yes then return true
export const isConfirmedAcceptor = (uid, taskId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/servicesRequests/${taskId}/confirmedGuests`).once('value', (snapshot) => {
            resolve(snapshot.child(uid).exists());
        })
    } catch (e) {
        reject(e)
    }
})

// Assign user {userId} as acceptor of task {serviceId} and return whatsapp number of requester. No one being used
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

export const finalizeGuestList = (taskId) => new Promise((resolve, reject) => {
  try {
    let ref = firebase.database().ref(`/servicesRequests/${taskId}/acceptorIds`);
    ref.once("value", function(snapshot){
      let data = snapshot.val();
      let allGuests = Object.values(data);
      let confirmedGuests = allGuests.filter(guest => guest.guestStatus == 1);
      console.log('confirmedGuests: ', confirmedGuests);
      let confirmedRef = firebase.database().ref(`/servicesRequests/${taskId}/confirmedGuests`);
      confirmedGuests.map(guest => confirmedRef.child(guest.id).set(guest) )
      firebase.database().ref(`/servicesRequests/${taskId}`).update({status: 1});
      resolve(confirmedGuests)
    } )
  } catch(e) {
    reject(e)
  }
})

// Push this user to the list of acceptors
export const addAcceptor = (userId, serviceId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();

        var ref = firebase.database().ref(`/servicesRequests/${serviceId}/acceptorIds/${userId}`);
        ref.update({id: userId, guestStatus:0});
        //Get first name of this particular acceptor
        getName(userId).then(firstName=>
        {
          const first = firstName;
          //Get last name of this particular acceptor
          getLastName(userId).then(lastName=>
          {
            const fullName = `${firstName} ${lastName}`;
            ref.update({fullName: fullName})
          });
        });

        //Increment interested count for this task
        firebase.database().ref(`/servicesRequests/${serviceId}/interestedCount`).transaction(function(interestedCount){
          return (interestedCount || 0) + 1;
        });

        console.log('pushed user to acceptor list')
    } catch (e) {
        reject(e)
    }
})

// Expects service request ID in parameter
// Marks request as done and CREDITS coins to requester
// as well as to the acceptor
export const markRequestDone = (id) => new Promise((resolve, reject) => {
    try {
        var ref = firebase.database().ref(`/servicesRequests/${id}`);
        ref.update({status:2});
        ref.once("value", function(snapshot) {
            const {clientId, serverId} = snapshot.val();
            firebase.database().ref(`/users/${clientId}/coins`).transaction(function(coins){
              return (coins || 0) + 1;
              //previously was return (coins || 0) - 1;
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

// Expects current user ID UID, Task id ID and whether the user is a client boolean isClient
// Marks service request cancelled
export const markRequestCancelled = (uid, id, isClient) => new Promise((resolve, reject) => {
    try {
        var ref = firebase.database().ref(`/servicesRequests/${id}`);
        if(isClient){
          ref.update({status:3});
          incUserDarkScore(uid, 2);
        }else{
          //Guest is cancelling
          ref.child(`confirmedGuests/${uid}`).update({guestStatus: 3})
          incUserDarkScore(uid, 1);
          //Also add it to the users rejected list
          appendRejectedTask(uid, id);
        }
        resolve(true);
    } catch (e) {
        reject(e)
    }
})

// Expects user ID in parameters
// Returns whatsapp number of the user
export const getWhatsapp = (userId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        var wRef = firebase.database().ref(`/users/${userId}/whatsapp`);
        wRef.once("value", function(whatsapp){resolve(whatsapp.val());})
    } catch (e) {
        reject(e)
    }
})

// Expects user ID in parameters
// Returns firstname of the user
export const getName = (userId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        var nameRef = firebase.database().ref(`/users/${userId}/firstName`);
        nameRef.once("value", function(firstName){resolve(firstName.val());})
    } catch (e) {
        reject(e)
    }
})

// Expects user ID in parameters
// Returns lastname of the user
export const getLastName = (userId) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        var nameRef = firebase.database().ref(`/users/${userId}/lastName`);
        nameRef.once("value", function(lastName){resolve(lastName.val());})
    } catch (e) {
        reject(e)
    }
})

// Expects user ID in parameters
// Returns firstname of the user
export const getFullName = (userId) => new Promise((resolve, reject) => {
    try {
      //Get first name of this user
      getName(userId).then(firstName=>
      {
        const first = firstName;
        //Get last name of this user
        getLastName(userId).then(lastName=>
        {
          const fullName = `${firstName} ${lastName}`;
          resolve(fullName);
        });
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

// user has done some malicious behavior. Increase their Dark Score by score
export const incUserDarkScore = (userId, score) => new Promise((resolve, reject) => {
    try {
        resolve(firebase.database().ref(`/users/${userId}`).update({darkScore: score}));
    } catch (e) {
        reject(e)
    }
})

// Expects user Id in parameters
// Returns the current Adour coin balance of user
export const getCoins = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}/coins`).once("value", function(coins){resolve(coins.val() || 0);})
    } catch (e) {
        reject(e)
    }
})

//Stats

// Count number of serviceRequests
export const countServicesRequests = () => {
  let countAcc = 0;
  let countReq = 0;
  let countDone = 0;
  let countProg = 0;
  let countOpen = 0;
  let openPostUsers = [];
  let openPosts = [];

  //Count various statuses
  var srRef = firebase.database().ref("servicesRequests");
  srRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const {status, clientId, id} = childSnapshot.val();
      if(status == 4) countAcc++;
      else if (status == 3) countReq++;
      else if (status == 2) countDone++;
      else if (status == 1) countProg++;
      else if (status == 0) {
        countOpen++;
        openPostUsers.push(clientId);
        openPosts.push(id)
      }
    });
    console.log('number of activities cancelled by acceptor: ', countAcc);
    console.log('number of activities cancelled by requester: ', countReq);
    console.log('number of activities  marked as done: ', countDone);
    console.log('number of activities in progress: ', countProg);
    console.log('number of open activities: ', countOpen);
    console.log('list of users who currently have open activities: ', openPostUsers);
    console.log('list of open activities: ', openPosts);
  });

  //Count number of unique users created activities
  var userPostCounted = [];

  srRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const {clientId} = childSnapshot.val();
      if (!userPostCounted.includes(clientId)){
        userPostCounted.push(clientId);
      }
    });
    console.log('number of activity posts created by unique users: ', userPostCounted.length);
    console.log('list of users who has ever created a post: ', userPostCounted);
  });



  srRef.once("value")
  .then(function(snapshot) {
    var servicesReqCount = snapshot.numChildren();
    console.log('number of servicesRequests: ', servicesReqCount);
  });

  var msgsRef = firebase.database().ref("messages");
  msgsRef.once("value")
  .then(function(snapshot) {
    var msgsNum = snapshot.numChildren();
    console.log('number of message heads : ', msgsNum);
  });

  //Count users

  var usersRef = firebase.database().ref("users");
  usersRef.once("value")
  .then(function(snapshot) {
    var usersNum = snapshot.numChildren();
    console.log('number of legitimate users : ', usersNum);
  });


}

/*
* kept firebase reference in one place
* */
export const firebaseReferences = {
    USERS: firebase.database().ref('/users'),
    SERVICES: firebase.database().ref('/services'),
    SERVICES_REQUESTS: firebase.database().ref('/servicesRequests')
}
