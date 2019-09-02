import firebase from 'react-native-firebase'
import uuid from 'react-native-uuid'
import {Alert} from 'react-native'
import * as _ from 'lodash'
/*
* method to post the service request.
OUTDATED / NOT BEING USED. CLOUD FUNCTION IS BEING USED AND IS UPDATED
* */
export const postServiceRequest = ({serviceId: serviceId, when: when, details: details, anonymous: anonymous, customTitle: customTitle}) => new Promise((resolve, reject) => {
    try {
        console.log('inside posting Req')
        const {currentUser: {uid} = {}} = firebase.auth()
          getFullName(uid).then(fullName =>{
            firebase.database().ref(`networks/${networkId}/allPosts`).once('value', (snapshot) => {
                let allPosts = snapshot.val()
                let customBool = false;
                if (_.isEmpty(allPosts)) {
                    allPosts = {}
                }
                if (serviceId === 'custom'){
                  customBool = true;
                }
                const id = uuid.v4()
                allPosts[id] = {
                  id,
                  serviceId,
                  hostId: uid,
                  when: when,
                  details: details,
                  anonymous: anonymous,
                  custom: customBool,
                  customTitle: customTitle,
                  status: 0,
                  interestedCount: 0,
                  created_at:firebase.database.ServerValue.TIMESTAMP,
                  hostName: fullName,
                }
                firebase.database().ref(`networks/${networkId}/allPosts`).update(allPosts).then(res => {
                    let userHostingRef = firebase.database().ref(`/users/${uid}/posts/host/${id}`);
                    userHostingRef.update({id: id}).then(finalRes => {
                      console.log('Posted with ID: ', id);
                      Alert.alert('Posted Successfully. You can find it on your Dashboard.')
                      resolve(true)
                    })
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
            img: 'https://tagmateapp.com/assets/item_img/custom.jpg',
            icon: 'av-timer'
          })
          resolve(newServiceId);
        });
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


export const setUserBio = (userId, bio) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}`).update({bio:bio}).then(res=>{resolve(true)});
    } catch (e) {
        reject(e)
    }
})

export const updateAvatar = (userId, url, thumbURL) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}`).update({profilePicture:url, thumbnail: thumbURL}).then(res=>{resolve(true)});
    } catch (e) {
        reject(e)
    }
})

// Saves device token to the user's object
export const saveDeviceToken = (uid, deviceToken) => new Promise((resolve, reject) => {
    try {
        let devTokensRef = firebase.database().ref(`/users/${uid}/deviceTokens`);
        devTokensRef.once('value', (snapshot) => {
          let deviceTokens = snapshot.val()
          if (!Array.isArray(deviceTokens)) {
              deviceTokens = []
          }
          //If the given deviceToken is not found in the deviceTokens array in the firebase database
          if (!_.includes(deviceTokens, deviceToken)) {
              deviceTokens.push(deviceToken)
              devTokensRef.set(deviceTokens).then(res => {
                resolve(true)
              })
          }
        })
    } catch (e) {
        reject(e)
    }
})

// Copies profile pic URL to thumbnail

export const setInitialThumbnail = (currentUser) => new Promise((resolve, reject) => {
    try {
      console.log('Inside setInitialThumbnail');
      let thumbnailExists = false;
      //does the thumbnail object already exist?
      firebase.database().ref(`/users/${currentUser.user.uid}/thumbnail`).once('value', (snapshot) => {
        console.log('snapshot.exists(): ',snapshot.exists());
        thumbnailExists = snapshot.exists();
        if(thumbnailExists === true){
          resolve(true)
        }
      }).then(result => {
        console.log('thumbnailExists: ', thumbnailExists);
        if(!thumbnailExists){
          firebase.database().ref(`/users/${currentUser.user.uid}`).update({
            thumbnail: currentUser.user.photoURL
          }).then(res => resolve(true))
        }

      })

    } catch (e) {
        reject(e)
    }
})

export const populateUserServices = (currentUser) => new Promise((resolve, reject) => {
    try {
      let servicesCount = 0
      let services = []
      console.log('currentUser: ', currentUser)
      console.log('Inside populate user services in firebaseUtils')
      //userRef.child(`services`).set(myServices);
      firebase.database().ref(`/users/${currentUser.user.uid}/services`).once('value').then(snapshot => {
        console.log('inside firebase snapshot 1')
      if (snapshot.val() === null ) {
        console.log('inside firebase snapshot 2')
        //Get the count of all available services
        firebase.database().ref('/services').once('value', function(snapshot) {
          console.log('inside firebase snapshot 3')
           servicesCount = snapshot.numChildren();
           for(i = 1; i<servicesCount+1; i++){
             services.push('service' + i)
           }
           console.log('Populating new user object with all services by default')
           var ref = firebase.database().ref(`/users/${currentUser.user.uid}`);
           ref.child(`services`).set(services).then(res => {
             resolve(true)
           })
           console.log('inside firebase snapshot 4')


         },
         function(error) {
          // The callback failed.
          console.log('inside firebase snapshot ERROR')
          console.error(error);
        });
      }
      resolve(true)
    });
    } catch (e) {
        reject(e)
    }
})


export const addNetworkDetails = (currentUser) => new Promise((resolve, reject) => {
    try {
      console.log('Inside addNetworkDetails');
      let networkInfoExists = false;
      //does network object already exist?
      firebase.database().ref(`/users/${currentUser.user.uid}/network`).once('value', (snapshot) => {
        console.log('snapshot.exists(): ',snapshot.exists());
        networkInfoExists = snapshot.exists();
        resolve(snapshot.exists())
      }).then(result => {
        console.log('networkInfoExists: ', networkInfoExists);
        //Only update network Info if it doesn't exist
        if(!networkInfoExists){
          let email = currentUser.user.email;
          let domain = email.substring(email.lastIndexOf("@") +1);
          let uniqueDomainCode = domain.replace(/\./g,'x')
          let name = domain.slice(0, domain.indexOf(".") );
          name = name.charAt(0).toUpperCase() + name.slice(1);

          let network = {
            domain: domain,
            name: name,
            id: uniqueDomainCode
          }
          console.log('network: ', network);
          console.log('checking if firebase user email stayed intact: ', currentUser.user.email)
          firebase.database().ref(`/users/${currentUser.user.uid}/network`).update(network).then(res => {
            firebase.database().ref(`/networks/${uniqueDomainCode}/users/${currentUser.user.uid}`).set(true).then(lres => {
              resolve(true)
            })
          });
        }

      })

    } catch (e) {
        reject(e)
    }
})


// get the list of all the task IDs that this user has rejected or accepted
export const getHiddenPosts = (uid) => new Promise((resolve, reject) => {
    try {
      let accHiddenPosts = [];
      let rejHiddenPosts = [];
      let hiddenPosts = [];

      firebase.database().ref(`users/${uid}/hiddenPosts/accepted`).once('value', (snapshot) => {
        if(snapshot.val() != undefined){
          let data = snapshot.val();
          accHiddenPosts = Object.values(data);
        }
      }).then(res => {
        firebase.database().ref(`users/${uid}/hiddenPosts/rejected`).once('value', (snapshot) => {
          if(snapshot.val() != undefined){
            let data = snapshot.val();
            rejHiddenPosts = Object.values(data);
          }
        }).then(finRes => {
          hiddenPosts = accHiddenPosts.concat(rejHiddenPosts);
          console.log('accHiddenPosts: ', accHiddenPosts);
          console.log('rejHiddenPosts: ', rejHiddenPosts);
          console.log('hiddenPosts: ', hiddenPosts);
          resolve(hiddenPosts)
        })
      })

      //resolve(hiddenPosts)

      /*
        firebase.database().ref(`users/${uid}/hiddenPosts`).once('value', (snapshot) => {
          if(snapshot.val() != undefined){
            let data = snapshot.val();
            let hiddenPosts = Object.values(data);
            resolve(hiddenPosts)
          } else {
            resolve([])
          }
        });
        */
    } catch (e) {
        reject(e)
    }
})

export const getBlockedList = (uid) => new Promise((resolve, reject) => {
    try {
        let blockedList = [];
        let blockRef = firebase.database().ref(`users/${uid}/block`);
        //get the list of users that has been blocked by the current user
        blockRef.child('blocked').once('value', (snapshot) => {
          if(snapshot.val() != undefined){
            let data = snapshot.val();
            let users = Object.values(data);
            users.map(user => {
              blockedList.push(user.id)
            })
          }
        }).then(res => {
          //get the list of users that has blocked the current user
          blockRef.child('blockedBy').once('value', (snapshot) => {
            if(snapshot.val() != undefined){
              let data = snapshot.val();
              let users = Object.values(data);
              users.map(user => {
                blockedList.push(user.id)
              })
            }
          }).then(finRes => {
            //get the list of users that the admin has soft blocked
            //TODO: change blockRef to a root level ref so that the admin only has to add softblocked users once
            firebase.database().ref('admin/softBlockedUids').once('value', (snapshot) => {
              if(snapshot.val() != undefined){
                let data = snapshot.val();
                let users = Object.values(data);
                users.map(user => {
                  blockedList.push(user.id)
                })
              }
            }).then(result => {
              resolve(blockedList)
            })
          })
        })
    } catch (e) {
        reject(e)
    }
})

// get the total number of unread chat msgs by this user
export const getTotalUnread = (uid) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`users/${uid}/messages/`).once('value', (snapshot) => {
          if(snapshot.val() == undefined){
            resolve(0)
          }
          let totalUnread = 0;
          snapshot.forEach(function(childSnapshot) {
            const {unreadCount} = childSnapshot.val();
            totalUnread = totalUnread + unreadCount;
          })
          resolve(totalUnread);
        });
    } catch (e) {
        reject(e)
    }
})

// get the total number of people interested in this user's all open activities
export const getTotalInterested = (uid) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${uid}/totalInterested`).once('value', (snapshot) => {
          resolve(snapshot.val() || 0);
        });
    } catch (e) {
        reject(e)
    }
})

/*
* method toget all the task that user with userId can perform
TO DO: YET TO DEFINE NETWORKID
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
            firebase.database().ref(`networks/${networkId}/allPosts`).once('value', (snapshot) => {
                // Fetching all tasks decided upon by user {userId}
                firebase.database().ref(`/users/${userId}/hiddenPosts`).once('value', (snapshotb) => {
                    let myTasks = []
                    const allRequests = snapshot.val() || {}
                    console.log('allRequests: ', allRequests)
                    const keys = Object.keys(allRequests)
                    const hiddenPosts = snapshotb.val() || {}
                    for (let key of keys) {
                    // Generating a list of only those tasks which user {userId} can perform, has not decided upon, did not create himself and still are available to be accepted.
                        if (_.includes(myServices, allRequests[key].serviceId) && !_.includes(hiddenPosts, allRequests[key].id) && allRequests[key].hostId !== userId && typeof allRequests[key].status != "undefined" && allRequests[key].status == 0) {

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
            getNetworkId(userId).then(networkId => {
              firebase.database().ref(`networks/${networkId}/allPosts`).once('value', (snapshot) => {
                  let requestedTasks = []
                  let acceptedTasks = []
                  const allRequests = snapshot.val() || {}
                  const keys = Object.keys(allRequests)
                  for (let key of keys)
                  {
                      console.log("USERID: ",userId);
                      console.log(allRequests[key].hostId,allRequests[key].serverId);

                      if(allRequests[key].serverId == userId) acceptedTasks.push(allRequests[key])
                      else if(allRequests[key].hostId == userId) requestedTasks.push(allRequests[key])
                  }
                  let allRelatedTasks = {requestedTasks, acceptedTasks}
                  resolve(allRelatedTasks)
                  return
              })
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
            getNetworkId(userId).then(networkId => {
              firebase.database().ref(`networks/${networkId}/allPosts`).once('value', (snapshot) => {
                  const allRequests = snapshot.val() || {}
                  const keys = Object.keys(allRequests)
                  var count = 0;
                  for (let key of keys)
                  {
                      if(allRequests[key].hostId == userId && (allRequests[key].status == 0 || allRequests[key].status == 1)) count++;
                  }
                  getCoins(userId).then(coins => {
                      console.log('coins',coins,'reqs',count);
                      if(count >= coins) resolve(false);
                      else resolve(true);
                      return;
                  });
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
export const serverExists = (serviceId, userId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(userId).then(networkId => {
          firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/serverId`).once('value', (snapshot) => {
              console.log(snapshot.exists()+" <-- ");
              resolve(snapshot.exists())
          })
        })

    } catch (e) {
        reject(e)
    }
})

// Check if given task has already been accepted by someone returns boolean
export const confGuestExists = (taskId, userId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(userId).then(networkId => {
          firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/confirmedGuest`).once('value', (snapshot) => {
              resolve(snapshot.exists())
          })
        })

    } catch (e) {
        reject(e)
    }
})

// gets the list of all acceptors who have accepted this particular activity with serviceId
export const getAcceptors = (serviceId, userId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(userId).then(networkId => {
          firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/acceptorIds`).once('value', (snapshot) => {
              const acceptorIds = snapshot.val() || []
              resolve(acceptorIds || [])
          })
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
//Checks if uid exists in the acceptorIds array of serviceId allPosts
export const alreadyAccepted = (uid, serviceId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(uid).then(networkId => {
          firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/acceptorIds`).once('value', (snapshot) => {
              resolve(snapshot.child(uid).exists());
          })
        })

    } catch (e) {
        reject(e)
    }
})

// expects an acceptors UID and task ID. Checks if the host has confirmed this acceptor, if yes then return true
export const isConfirmedAcceptor = (uid, taskId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(uid).then(networkId => {
          firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/confirmedGuests`).once('value', (snapshot) => {
              resolve(snapshot.child(uid).exists());
          })
        })

    } catch (e) {
        reject(e)
    }
})

// Assign user {userId} as acceptor of task {serviceId} and return whatsapp number of requester. No one being used
export const addServer = (userId, serviceId) => new Promise((resolve, reject) => {
    try {
        getNetworkId(userId).then(networkId => {
          let ref = firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}`);
          ref.update({serverId:userId,status:1});
          // Now returning the Whatsapp number of requester (client)
          ref.child(`hostId`).once("value", function(snapshot) {
              resolve(getWhatsapp(snapshot.val()));
          });
        })

    } catch (e) {
        reject(e)
    }
})

export const finalizeGuestList = (taskId, hostId) => new Promise((resolve, reject) => {
  try {
    getNetworkId(hostId).then(networkId => {
      let ref = firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/acceptorIds`);
      ref.once("value", function(snapshot){
        let data = snapshot.val();
        let allGuests = Object.values(data);
        let confirmedGuests = allGuests.filter(guest => guest.guestStatus == 1);
        console.log('confirmedGuests: ', confirmedGuests);
        if(confirmedGuests.length != 0)
        {
          let confirmedRef = firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/confirmedGuests`);
          confirmedGuests.map(guest => confirmedRef.child(guest.id).set(guest) )
          firebase.database().ref(`networks/${networkId}/allPosts/${taskId}`).update({status: 1});
          resolve(true)
        }else{
          resolve(false);
        }
      } )
    })

  } catch(e) {
    reject(e)
  }
})

// Push this user to the list of acceptors
export const addAcceptor = (userId, serviceId, hostId, publicPost) => new Promise((resolve, reject) => {
    try {
        const {currentUser} = firebase.auth();
        getNetworkId(userId).then(networkId => {
          var ref = firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/acceptorIds/${userId}`);
          ref.update({id: userId, guestStatus:0}).then(updRes => {
            if(publicPost){
              //Since this is a public event, automatically add this userId to confirmedList
              confRef = firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/confirmedGuests/${userId}`);
              confRef.update({id: userId, guestStatus:1});
              //Increment confirmed count
              firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/confirmedCount`).transaction(function(confirmedCount){
                return (confirmedCount || 0) + 1;
              });
            }
          }).then(mainRes => {
              //Get first name of this particular acceptor
              getName(userId).then(firstName=>
              {
                const first = firstName;
                //Get last name of this particular acceptor
                getLastName(userId).then(lastName=>
                {
                  getThumbURL(userId).then(thumbnail => {
                    const fullName = `${firstName} ${lastName}`;
                    ref.update({fullName: fullName, thumbnail: thumbnail}).then(upRes => {
                      if(publicPost) confRef.update({fullName: fullName, thumbnail: thumbnail});
                    })
                  })
                });
              });
              console.log('inside add acceptor')
              appendHiddenPosts(userId, serviceId, true);

              //Since the user has accepted this post, we won't be showing this on the user's live post screen anymore
              //firebase.database().ref(`/users/${userId}/livePosts/${serviceId}`).remove();

              //Increment interested count for this task
              firebase.database().ref(`networks/${networkId}/allPosts/${serviceId}/interestedCount`).transaction(function(interestedCount){
                return (interestedCount || 0) + 1;
              });
              console.log('pushed user to acceptor list')
              resolve(true)

            })
          })
    } catch (e) {
        reject(e)
    }
})

// No longer being used. Cloud function is being used instead.
export const markRequestDone = (id, uid) => new Promise((resolve, reject) => {
    try {
        getNetworkId(uid).then(networkId => {
          let ref = firebase.database().ref(`networks/${networkId}/allPosts/${id}`);
          ref.update({status:2});
          ref.once("value", function(snapshot) {
              const {hostId, serverId} = snapshot.val();
              firebase.database().ref(`/users/${hostId}/coins`).transaction(function(coins){
                return (coins || 0) + 1;
                //previously was return (coins || 0) - 1;
              });
              firebase.database().ref(`/users/${serverId}/coins`).transaction(function(coins){
                return (coins || 0) + 1;
              });
              resolve(true);
          });
        })
    } catch (e) {
        reject(e)
    }
})

export const resetUnreadCount = (uid, id) => new Promise((resolve, reject) => {
    try {
        ref = firebase.database().ref(`/users/${uid}/messages/${id}`);
        ref.set({id: id, unreadCount: 0});
    } catch (e) {
        reject(e)
    }
})

export const resetUnreadCountDirect = (uid, id) => new Promise((resolve, reject) => {
    try {
        ref = firebase.database().ref(`/users/${uid}/directMessages/${id}`);
        ref.set({uid: id, unreadCount: 0});
    } catch (e) {
        reject(e)
    }
})

// Expects current user ID UID, Task id ID and whether the user is a client boolean isClient
// Marks service request cancelled
export const markRequestCancelled = (uid, id, isClient) => new Promise((resolve, reject) => {
    try {
        getNetworkId(uid).then(networkId => {
          var ref = firebase.database().ref(`networks/${networkId}/allPosts/${id}`);
          if(isClient){
            ref.update({status:3}).then(res => {
              //incUserDarkScore(uid, 2);
              deletePostFromUser(uid, id, 'host').then(resB => {
                //Reset unread count for this blob
                resetUnreadCount(uid, id).then(resC => {
                  resolve(true)
                })
              })
            })

          }else{
            //Guest is cancelling
            ref.child(`confirmedGuests/${uid}`).update({guestStatus: 3}).then(resA => {
              deletePostFromUser(uid, id, 'guest').then(resB => {
                incUserDarkScore(uid, 1).then(resC => {
                  resetUnreadCount(uid, id).then(resD => {
                    resolve(true)
                  })
                })
                //Also add it to the users decided upon list
                //appendHiddenPosts(uid, id); no longer needed since the post was already removed from this user's livePosts object when he or she swiped right
              })
            })

          }
        })
    } catch (e) {
        reject(e)
    }
})

export const deletePostFromUser = (uid, taskId, deletedBy) => new Promise((resolve, reject) => {
    try {
      console.log('Inside deletePostFromUser')
      if(deletedBy === 'host'){
        //Its cancelled by the host
        console.log(`Removing the task ${taskId} from the users host object`)
        firebase.database().ref(`/users/${uid}/posts/host/${taskId}`).remove().then( res => {resolve(true)})
      }else if(deletedBy === 'guest'){
        //guest opted out
        firebase.database().ref(`/users/${uid}/posts/guest/${taskId}`).remove().then( res => {resolve(true)})
      }

    } catch (e) {
        reject(e)
    }
})

export const undoRejects = (uid) => new Promise((resolve, reject) => {
    try {
      firebase.database().ref(`/users/${uid}/hiddenPosts/rejected`).remove().then( res => {resolve(true)})
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
// Returns the avatar of the user
export const getAvatar = (userId) => new Promise((resolve, reject) => {
    try {
        var avatarRef = firebase.database().ref(`/users/${userId}/profilePicture`);
        avatarRef.once("value", function(avatar){resolve(avatar.val());})
    } catch (e) {
        reject(e)
    }
})

// Expects user ID in parameters
// Returns the avatar of the user
export const isVerified = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}/verified`).once("value", function(verified){resolve(verified.val());})
    } catch (e) {
        reject(e)
    }
})

export const allowsDM = (userId) => new Promise((resolve, reject) => {
    try {
        firebase.database().ref(`/users/${userId}/dmAllow`).once("value", function(dmAllow){resolve(dmAllow.val());})
    } catch (e) {
        reject(e)
    }
})

export const getUserThumbnail = (userId) => new Promise((resolve, reject) => {
    try {
        var avatarRef = firebase.database().ref(`/users/${userId}/thumbnail`);
        avatarRef.once("value", function(thumbnail){resolve(thumbnail.val());})
    } catch (e) {
        reject(e)
    }
})

export const getBio = (userId) => new Promise((resolve, reject) => {
    try {
        var nameRef = firebase.database().ref(`/users/${userId}/bio`);
        nameRef.once("value", function(bio){resolve(bio.val() || '' );})
    } catch (e) {
        reject(e)
    }
})

export const getThumbURL = (userId) => new Promise((resolve, reject) => {
    try {
        let nameRef = firebase.database().ref(`/users/${userId}/thumbnail`);
        nameRef.once("value", function(thumbnail){resolve(thumbnail.val());})
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

// To note in database that user {userId} has rejected or accepted a post{serviceId} . The app wont show these tasks to this user again
export const appendHiddenPosts = (userId, serviceId, swipeRight) => new Promise((resolve, reject) => {
    try {
      if(swipeRight){
        resolve(firebase.database().ref(`/users/${userId}/hiddenPosts/accepted`).push(serviceId));
      }else{
        resolve(firebase.database().ref(`/users/${userId}/hiddenPosts/rejected`).push(serviceId));
      }
        //resolve(firebase.database().ref(`/users/${userId}/hiddenPosts`).push(serviceId));
    } catch (e) {
        reject(e)
    }
})

export const rejectTask = (userId, serviceId) => new Promise((resolve, reject) => {
  try {
    resolve(
      //Since the user has rejected this post, we won't be showing this on the user's live post screen anymore
      firebase.database().ref(`/users/${userId}/livePosts/${serviceId}`).remove()
    )
  } catch (e) {
    reject(e)
  }
})

//If this user is the host of this post, do not show it / remove it from livePosts
export const removeSelfHostedPosts = (userId, serviceId) => new Promise((resolve, reject) => {
  try{
      firebase.database().ref(`users/${userId}/posts/host/${serviceId}`).once('value', (userIsTheHost) => {
        console.log('userIsTheHost: ', userIsTheHost)
        if(userIsTheHost.exists()){
          firebase.database().ref(`/users/${userId}/livePosts/${serviceId}`).remove()
          resolve(true)
        }else{
          resolve(false)
        }
      })

  } catch(e){
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

export const getNetworkId = (uid) => new Promise((resolve, reject) => {
  try{
    firebase.database().ref(`/users/${uid}/network/id`).once('value', (snapshot) => {
      resolve(snapshot.val());
    })
  } catch(e) {
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

//function presumes the uid is a confirmed acceptor
//checks if the uid was a confirmed acceptor that has now opted out
export const hasOptedOutAsGuest = (uid, taskId) => new Promise((resolve, reject) => {
    try {
      getNetworkId(uid).then(networkId => {
        let hostId;
        firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/hostId`).once("value", function(snapshot) {
          hostId = snapshot.val();
        })
        if(uid != hostId)
        {
          let result;
          let ref = firebase.database().ref(`networks/${networkId}/allPosts/${taskId}/confirmedGuests/${uid}/guestStatus`);
          ref.once("value", function(snapshot){
            if(snapshot.val() == 3){
              result = true;
            } else {
              result = false;
            }
            resolve(result);
          })
        } else {
          resolve(null);
        }
      })

    } catch (e) {
        reject(e)
    }
})

/*
export const massJobs = () => {
  //usersToSave = ["kHgG7F9IubPRXyeiBNl9adpsYoo1", "3jOLGdMgClejVrZH4FsaOyue3AS2", "I73ZXJEh7uXDzn7LLX6tSowmJUE3", "TdCg22Vcv8TpZdQPPiOL44v9g462", "aQuMUbYPU6gbXTdRCFpZgFJuoZ93", "yM36vYdtLFdh8rNk0ayJE6QEiJ32", "MQoEZERX8BcBofbNtkMf4KaUUFE3"];

  firebase.database().ref('users').once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const uid = childSnapshot.key;
      firebase.database().ref(`users/${uid}`).update({dmAllow: true});
      //const profilePic = childSnapshot.val().profilePicture;
      //firebase.database().ref(`users/${uid}/hiddenPosts`).remove();

      //if(!usersToSave.includes(uid)){
      //    firebase.database().ref(`users/${uid}`).remove();
      //    console.log('done. Deleted: ', childSnapshot.firstName);
      //}

    })
  })
}
*/



//Stats

// Count number of serviceRequests
export const countallPosts = (networkId) => {
  let countAcc = 0;
  let countReq = 0;
  let countDone = 0;
  let countProg = 0;
  let countOpen = 0;
  let openPostUsers = [];
  let openPosts = [];
  let debugPosts = [];

  //Count various statuses
  var srRef = firebase.database().ref(`networks/${networkId}/allPosts`);
  srRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const {status, hostId, id} = childSnapshot.val();
      if(status == 4) countAcc++;
      else if (status == 3) countReq++;
      else if (status == 2) countDone++;
      else if (status == 1){
        /*
        if(hostId == "2J9aK7aFFFgK4SphheV1jRrFiVv2"){
          debugPosts.push(id);
        }
        */
        countProg++;
      }
      else if (status == 0) {
        countOpen++;
        openPostUsers.push(hostId);
        openPosts.push(id)
        if(hostId == "2J9aK7aFFFgK4SphheV1jRrFiVv2"){
          debugPosts.push(id);
        }
      }
    });
    console.log('number of activities cancelled by acceptor: ', countAcc);
    console.log('number of activities cancelled by requester: ', countReq);
    console.log('number of activities  marked as done: ', countDone);
    console.log('number of activities in progress: ', countProg);
    console.log('number of open activities: ', countOpen);
    console.log('list of users who currently have open activities: ', openPostUsers);
    console.log('list of open activities: ', openPosts);
    console.log('list of all activities created by Shivam: ', debugPosts);
  });

  //Count number of unique users created activities
  var userPostCounted = [];

  srRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      const {hostId} = childSnapshot.val();
      if (!userPostCounted.includes(hostId)){
        userPostCounted.push(hostId);
      }
    });
    console.log('number of activity posts created by unique users: ', userPostCounted.length);
    console.log('list of users who has ever created a post: ', userPostCounted);
  });



  srRef.once("value")
  .then(function(snapshot) {
    var servicesReqCount = snapshot.numChildren();
    console.log('number of allPosts: ', servicesReqCount);
  });

  var msgsRef = firebase.database().ref(`networks/${networkId}/messages`);
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
    SERVICES_REQUESTS: firebase.database().ref('/allPosts')
}
