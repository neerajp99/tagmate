// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _ = require('lodash');

// initializes your application
admin.initializeApp();

// This function pushes notifications to a user (client) when their requested task is accepted by someone.
    exports.sendPushNotificationToRequester = functions.database
    .ref('/servicesRequests/{pushId}/serverId')
    .onCreate((snapshot, context) => {
        const pushId = context.params.pushId;
        if (!pushId) {
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
    .ref('/servicesRequests/{pushId}/confirmedGuests')
    .onCreate((snapshot, context) => {
        const pushId = context.params.pushId;
        if (!pushId) {
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
