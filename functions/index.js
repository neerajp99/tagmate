// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const uuid = require('uuid');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _ = require('lodash');

// initializes your application
admin.initializeApp();

  exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from a Serverless Database!");
  });

  exports.cloudFuncTest = functions.https.onCall((data, context) => {

      console.log(context.auth.uid);

      if (!data.some) {
          throw new functions.https.HttpsError(
            'invalid-argument', // code
            'Your error message goes here', // message
          );
      }

      return { someResponse: 'hello' };
  });

  exports.getNetworkId = functions.https.onCall((data, context) => {
    if (!data.uid) {
        throw new functions.https.HttpsError(
          'invalid-argument', // code
          'Please ensure you have filled all the fields' // message
        );
    }

    return admin.database().ref(`/users/${data.uid}/network/id`).once('value', (snapshot) => {
      return snapshot.val();
    })

  })

  exports.createNewPost = functions.https.onCall((data, context) => {
      console.log(context.auth.uid);

      if (!data.customTitle) {
          throw new functions.https.HttpsError(
            'invalid-argument', // code
            'Please ensure you have filled all the fields' // message
          );
      }

      console.log('inside posting Req')

      const uid = context.auth.uid;

      let customBool = false;
      if (data.serviceId === 'custom'){
        customBool = true;
      }
      const id_gen = uuid.v4()
      let post = {
        id: id_gen,
        serviceId: data.serviceId,
        clientId: uid,
        when: data.when,
        details: data.details,
        anonymous: data.anonymous,
        custom: customBool,
        customTitle: data.customTitle,
        status: 0,
        interestedCount: 0,
        created_at:admin.database.ServerValue.TIMESTAMP,
        hostName: data.fullName,
      }
      admin.database().ref(`networks/${data.networkId}/servicesRequests/${id_gen}`).update(post).then(res => {
          let userHostingRef = admin.database().ref(`/users/${uid}/posts/host/${id_gen}`);
          return userHostingRef.update(post).then(finalRes => {
          console.log('Posted with ID: ', id_gen);
          })
      })
  });

// This function pushes notifications to a user (client) when their requested task is accepted by someone.
    exports.sendPushNotificationToRequester = functions.database
    .ref('/networks/{networkId}/servicesRequests/{pushId}/serverId')
    .onCreate((snapshot, context) => {
        const {pushId, networkId} = context.params;
        if (!pushId || !networkId) {
            return console.log('missing mandatory params for sending push.')
        }
        let deviceTokens = []
        const requestPromise = snapshot.ref.parent.once('value')
        // Once we have clientId and serverId:
        return Promise.all([requestPromise])
            .then(results => {
                var item = results[0].val()
                const {serverId, clientId} = item
                const clientDevicesPromise = admin.database().ref(`/users/${clientId}`).once('value')
                const serverWhatsappPromise = admin.database().ref(`/users/${serverId}`).once('value')
                // Once we have device IDs of client (requester) and Whatsapp number of server (acceptor)
                return Promise.all([clientDevicesPromise, serverWhatsappPromise])
                .then(finResults =>
                {
                    const client = finResults[0].val()
                    const server = finResults[1].val()
                    // Terminate here if the client does not have any device IDs.
                    if(!client.hasOwnProperty('deviceTokens') || !client.deviceTokens.length) return console.log('No clients.')

                    const payload = {
                        notification: {
                            title: 'You have a new Chillmate!',
                            body: `Tap to find out more`
                        },
                        data: {
                            taskId: item.id,
                            notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
                        }
                    };
                    return admin.messaging().sendToDevice(client.deviceTokens, payload);
                })
            })
    });



// WIP This function sends push notifications when there are new unread chat messages for this user.
  exports.sendUnreadPushNotification = functions.database
  .ref('/users/{userId}/messages/{pushId}/unreadCount')
  .onCreate((snapshot, context) => {
      const pushId = context.params.pushId;
      const userId = context.params.userId;
      if (!pushId || !userId) {
          return console.log('missing mandatory params for sending push.')
      }
      let deviceTokens = []
      const userDevicePromise = admin.database().ref(`/users/${userId}`).once('value')
      return Promise.all([userDevicePromise]).then(results => {
        // Terminate here if the client does not have any device IDs.
        let userItem = results[0].val();
        if(!userItem.hasOwnProperty('deviceTokens') || !userItem.deviceTokens.length) return console.log('User does not have device ID.')
        const payload = {
            notification: {
                title: 'You have new messages!',
                body: `Tap to respond`
            },
            data: {
                taskId: pushId,
                notifType: 'OPEN_CHAT', // To tell the app what kind of notification this is.
            }
        };
        return admin.messaging().sendToDevice(userItem.deviceTokens, payload);
      })

  });

  // WIP This function sends push notifications when there are new unread chat messages for this user. This function is not working as of now
    exports.sendFinalizedListNotification = functions.database
    .ref('/networks/{networkId}/servicesRequests/{pushId}/confirmedGuests')
    .onCreate((snapshot, context) => {
        const {pushId, networkId} = context.params;
        if (!pushId || !networkId) {
            return console.log('missing mandatory params for sending push.')
        }
        let allDeviceTokens = []
        let guestIds = []
        const payload = {
            notification: {
                title: 'You have been accepted!',
                body: `Tap to chat`
            },
            data: {
                taskId: pushId,
                notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
            }
        };
          let confGuestsData = snapshot.val();
          let confGuestItems = Object.keys(confGuestsData).map(function(key) {
              return confGuestsData[key];
          });
          confGuestItems.map(guest => {
            guestIds.push(guest.id)
          })
          let promises = []
          for(let i=0; i<guestIds.length; i++){
            let userId = guestIds[i];
            let promise = admin.database().ref(`/users/${userId}/deviceTokens`).once('value', (tokenSnapshot) => {
              let userData = tokenSnapshot.val();
              let userItem = Object.keys(userData).map(function(key) {
                  return userData[key];
              });
              userItem.map(item => allDeviceTokens.push(item))
              return true
            })
            promises.push(promise);
          }
          return Promise.all(promises).then(() => {
            console.log('allDeviceTokens: ', allDeviceTokens)
            return admin.messaging().sendToDevice(allDeviceTokens, payload);
          })
    });

    exports.finalizeGuestListOps = functions.database
    .ref('/networks/{networkId}/servicesRequests/{pushId}/confirmedGuests')
    .onCreate((snapshot, context) => {
        const pushId = context.params.pushId;
        const networkId = context.params.networkId;
        if (!pushId) {
            return console.log('missing mandatory param pushId for sending push.')
        }else if(!networkId){
          return console.log('missing mandatory param networkId for sending push.')
        }
          let confGuestsData = snapshot.val();
          let confGuestItems = Object.keys(confGuestsData).map(function(key) {
              return confGuestsData[key];
          });

          admin.database().ref(`networks/${networkId}/servicesRequests/${pushId}`).once('value', (postSnapshot) => {
            let post = postSnapshot.val()

            confGuestItems.map(guest => {
              admin.database().ref(`/users/${guest.id}/posts/guest/${pushId}`).update(post)
            })

          })


    });

    exports.addLivePosts = functions.database
    .ref('/networks/{networkId}/servicesRequests/{postId}/')
    .onCreate((snapshot, context) => {
        const {postId, networkId} = context.params;
        if (!postId || !networkId) {
            return console.log('missing mandatory params for sending push.')
        }
          let postData = snapshot.val();
          if(postData.status == 0){
            return admin.database().ref(`networks/${networkId}/livePosts/${postId}`).update(postData)
          }
    });

    exports.manageLivePosts = functions.database
    .ref('networks/{networkId}/servicesRequests/{postId}')
    .onUpdate((change, context) => {
        const {postId, networkId} = context.params;
        if (!postId || !networkId) {
            return console.log('missing mandatory params for sending push.')
        }
        console.log('change.before.val() :', change.before.val());
        console.log('change.after.val() :', change.after.val());

        //if the post is no longer live, remove it from the livePosts reference object
        if(change.before.val().status == 0 && change.after.val().status != 0){
          console.log('Post no longer live. Removing it from livePosts.')
          return admin.database().ref(`networks/${networkId}/livePosts/${postId}`).remove();
        }

        let post = change.after.val();

        if(post.status === 1){
          //Since the post's guest list is finalized, it is no longer in livePosts, so we don't need to update livePosts
          console.log('Post change detected.')
          //Update the duplicate post for the host
          return admin.database().ref(`/users/${post.clientId}/posts/host/${postId}`).update(post).then(res => {
            console.log('Updated host post')

            //Now update the duplicate post for all the confirmed guests
            let guestIds = [];
            let confGuestItems = Object.keys(post.confirmedGuests).map(function(key) {
                return post.confirmedGuests[key];
            });
            confGuestItems.map(guest => {
              guestIds.push(guest.id)
            })
            let promises = []
            for(let i=0; i<guestIds.length; i++){
              let guestId = guestIds[i];
              promise = admin.database().ref(`/users/${guestId}/posts/guest/${post.id}`).update(post);
              promises.push(promise);
            }
            return Promise.all(promises).then(() => {
              console.log('final Promise returned')
            })

          })
        }

        //if the post is still live but something has changed, update it in livePosts and user's host object.
        // There is no guest object yet since the guest list is not finalized yet

        if(post.status === 0){
          admin.database().ref(`/networks/${networkId}/livePosts/${postId}`).update(post).then(res => {
            return admin.database().ref(`/users/${post.clientId}/posts/host/${postId}`).update(post)
          })
        }

    });

/*
// Sends notification to all confirmed guests when the host finalizes the list
  exports.sendFinalizedListNotification = functions.database
  .ref('/servicesRequests/{pushId}/confirmedGuests')
  .onCreate((snapshot, context) => {
      const pushId = context.params.pushId;
      if (!pushId) {
          return console.log('missing mandatory params for sending push.')
      }
      let allDeviceTokens = []
      const payload = {
          notification: {
              title: 'You are accepted!',
              body: `Tap to chat`
          },
          data: {
              taskId: pushId,
              notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
          }
      };

      let ref = admin.database().ref(`/servicesRequests/${pushId}/confirmedGuests`);
      ref.once('value', (snapshot) => {
        if(snapshot.val() == undefined) return console.log('confirmedGuests undefined')
        // For each confirmed guest
        snapshot.forEach(function(childSnapshot) {
          console.log('inside for each')
          const {id} = childSnapshot.val();
          //There can be multiple device tokens for one user
          admin.database().ref(`/users/${id}/deviceTokens`).once('value', (tokenSnapshot) => {
            if(tokenSnapshot.val() == undefined) return console.log('tokenSnapshot undefined')
            console.log('inside tokenSnapshot')
            let tokenData = tokenSnapshot.val();
            //Go inside the list and push each ID
            console.log('map - pushing device token to the array')
            tokenData.map(tokenId => allDeviceTokens.push(tokenId))
          })
        }).then(result => {
          return admin.messaging().sendToDevice(allDeviceTokens, payload);
        })

      })

  });
*/
