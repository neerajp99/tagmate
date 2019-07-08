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

// This function pushes notifications to a user (client) when their requested task is accepted by someone.
// No longer usable since Chillmate -> Instajude
    exports.sendPushNotificationToRequester = functions.database
    .ref('/networks/{networkId}/allPosts/{pushId}/serverId')
    .onCreate((snapshot, context) => {
        const {pushId, networkId} = context.params;
        if (!pushId || !networkId) {
            return console.log('missing mandatory params for sending push.')
        }
        let deviceTokens = []
        const requestPromise = snapshot.ref.parent.once('value')
        // Once we have hostId and serverId:
        return Promise.all([requestPromise])
            .then(results => {
                var item = results[0].val()
                const {serverId, hostId} = item
                const clientDevicesPromise = admin.database().ref(`/users/${hostId}`).once('value')
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

    // This function sends push notifications to all the hosts of livePosts with the information about how many people are interested in their activity
    // This is a manual trigger function. It must be called manually
    //Expects networkId to be passed
    // Note: not being used anywhere. Untested. May contain bugs.

      exports.pushNotifyHostOnManual = functions.https.onCall((data, context) => {
        if (!data.networkId) {
            throw new functions.https.HttpsError(
              'invalid-argument', // code
              'Please ensure you have filled all the fields' // message
            );
        }

          let hostIds = [];
          let guestsInterested = {};

          admin.database().ref(`/networks/${data.networkId}/livePosts`).once('value', (snapshot) => {
            snapshot.forEach(function(postSnapshot) {
              hostIds.push(postSnapshot.hostId)
              guestsInterested[postSnapshot.hostId] = postSnapshot.interestedCount;
            })
          }).then(res => {
            console.log('guestsInterested: ', guestsInterested);
            console.log('livePosts hostIds: ', hostIds)

            for(let i=0; i<hostIds.length; i++){
              let userId = hostIds[i];
              let deviceTokens = []
              const userDevicePromise = admin.database().ref(`/users/${userId}`).once('value')
              return Promise.all([userDevicePromise]).then(results => {
                // Terminate here if the client does not have any device IDs.
                let userItem = results[0].val();
                if(!userItem.hasOwnProperty('deviceTokens') || !userItem.deviceTokens.length) return console.log('User does not have device ID.')
                const payload = {
                    notification: {
                        title: `${guestsInterested[userId]}+ are interested in your activity!`,
                        body: `Tap to see who!`
                    },
                    data: {
                        taskId: pushId,
                        notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
                    }
                };
                console.log('Sending Push Notification to Host: ', userId)
                return admin.messaging().sendToDevice(userItem.deviceTokens, payload);
              })
            }
          })

        })



        /*
        // Sends notification to all confirmed guests when the host finalizes the list
          exports.sendFinalizedListNotification = functions.database
          .ref('/allPosts/{pushId}/confirmedGuests')
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

              let ref = admin.database().ref(`/allPosts/${pushId}/confirmedGuests`);
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
