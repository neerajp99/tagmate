// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const uuid = require('uuid');
const {Storage} = require('@google-cloud/storage');

//Remove sharp
// Remove fs-extra

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _ = require('lodash');

// initializes your application
admin.initializeApp();

const storage = new Storage();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.generateThumbnail = functions.storage.object().onFinalize(async (object) => {

  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    return console.log('This is not an image.');
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the image is already a thumbnail.
  if (fileName.startsWith('thumb_')) {
    return console.log('Already a Thumbnail.');
  }

  // Download file from bucket.
  const bucket = admin.storage().bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const metadata = {
    contentType: contentType,
  };
  await bucket.file(filePath).download({destination: tempFilePath});
  console.log('Image downloaded locally to', tempFilePath);
  // Generate a thumbnail using ImageMagick.
  await spawn('convert', [tempFilePath, '-thumbnail', '64x64>', tempFilePath]);
  console.log('Thumbnail created at', tempFilePath);
  // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
  // Uploading the thumbnail.
  await bucket.upload(tempFilePath, {
    destination: thumbFilePath,
    metadata: metadata,
  });
  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  return fs.unlinkSync(tempFilePath);
});


//Takes care of what happens when a user presses Mark As Done button on DashboardScreen
exports.markRequestDone = functions.https.onCall((data, context) => {
  if (!data.uid || !data.postId || !data.networkId) {
      throw new functions.https.HttpsError(
        'invalid-argument', // code
        'Please ensure you have filled all the fields' // message
      );
  }
  let ref = admin.database().ref(`networks/${data.networkId}/allPosts/${data.postId}`);
  ref.update({status:2});
  ref.once("value", function(snapshot) {
      const {hostId} = snapshot.val();
      return admin.database().ref(`/users/${hostId}/coins`).transaction(function(coins){
        (coins || 0) + 1;
        //previously was return (coins || 0) - 1;
      })
  });
})

exports.blockUser = functions.https.onCall((data, context) => {
  if (!data.selfUid || !data.toBlockUid) {
      throw new functions.https.HttpsError(
        'invalid-argument', // code
        'Please ensure you have filled all the fields' // message
      );
  }
  admin.database().ref(`users/${data.selfUid}/block/blocked/${data.toBlockUid}`).update({id:data.toBlockUid}).then(result => {
    admin.database().ref(`users/${data.toBlockUid}/block/blockedBy/${data.selfUid}`).update({id:data.selfUid}).then(finRes => {
      return admin.database().ref(`users/${data.toBlockUid}/blockCount`).transaction(function(blockCount){
        return (blockCount || 0) + 1;
      });
    })
  })
})

exports.unblockUser = functions.https.onCall((data, context) => {
  if (!data.selfUid || !data.toUnblockUid) {
      throw new functions.https.HttpsError(
        'invalid-argument', // code
        'Please ensure you have filled all the fields' // message
      );
  }
  admin.database().ref(`users/${data.selfUid}/block/blocked/${data.toUnblockUid}`).remove().then(result => {
    admin.database().ref(`users/${data.toUnblockUid}/block/blockedBy/${data.selfUid}`).remove().then(finRes => {
      return admin.database().ref(`users/${data.toUnblockUid}/blockCount`).transaction(function(blockCount){
        return (blockCount || 0) - 1;
      });
    })
  })
})

//Handles both post reports and user reports
exports.report = functions.https.onCall((data, context) => {
  if (!data.uid || !data.reportID || !data.contentType || !data.reportType) {
      throw new functions.https.HttpsError(
        'invalid-argument', // code
        'Please ensure you have filled all the fields' // message
      );
  }
  return admin.database().ref(`reports/${data.contentType}/${data.reportID}`).update({
    id: data.reportID,
    reportedBy: data.uid,
    contentType: data.contentType, //user or post
    reportType: data.reportType // inapproperiate or spam
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

    const id_gen = uuid.v4()
    let post = {
      id: id_gen,
      hostId: uid,
      when: data.when,
      publicPost: data.publicPost,
      details: data.details,
      anonymous: data.anonymous,
      customTitle: data.customTitle,
      link: data.link,
      venue: data.venue,
      dtStart: data.dtStart,
      dtEnd: data.dtEnd,
      bgImage: data.bgImage,
      status: 0,
      interestedCount: 0,
      confirmedCount: 0,
      created_at:admin.database.ServerValue.TIMESTAMP,
      hostName: data.fullName,
      verified: data.verified,
      hostThumb: data.hostThumb,
    }
    admin.database().ref(`networks/${data.networkId}/allPosts/${id_gen}`).update(post).then(res => {
        let userHostingRef = admin.database().ref(`/users/${uid}/posts/host/${id_gen}`);
        return userHostingRef.update(post).then(finalRes => {
        console.log('Posted with ID: ', id_gen);
        })
    })
});

//This function runs when a user blocks another user.
// If the blocked user (blockedUid) is an unconfirmed guest who is interested in a post hosted by user (uid), we coerce the blocked user to be rejected
exports.onBlock = functions.database
.ref('/users/{uid}/block/blocked/{blockedUid}')
.onCreate((snapshot, context) => {
  const {uid, blockedUid} = context.params;
  if (!uid || !blockedUid) {
      return console.log('missing mandatory params')
  }
  let networkId;
  let allPostsRef;
  let hostedPostsList = []

  //Get network ID
  admin.database().ref(`/users/${uid}/network/id`).once('value', (snapshot) => {
    networkId = snapshot.val();
    allPostsRef = admin.database().ref(`networks/${networkId}/allPosts`);
  }).then(resA => {
    //Get all the posts hosted by this user
    //Complying with the standard guidelines, modify the main post (from allPosts) instead of the local one so that all duplicates are also updated
    admin.database().ref(`users/${uid}/posts/host`).once('value', (snapshot) => {
      let data = snapshot.val()
      let hostedPosts = Object.keys(data).map(function(key) {
          return data[key];
      });
      hostedPosts.map(post => {
        hostedPostsList.push(post.id)
      })
      for(let i=0; i<hostedPostsList.length; i++){
        let postId = hostedPostsList[i];
        return allPostsRef.child(`${postId}/acceptorIds`).once('value', (acceptorIds) => {
          return acceptorIds.forEach(function(guest) {
            if(blockedUid === guest.id){
              //Automatically mark this guest as rejected since this guest is now blocked
              console.log('about to end my job')
              return allPostsRef.child(`${postId}/acceptorIds/${blockedUid}`).update({guestStatus: 2})
            }
          })
        })
      }
    }).then(finRes => {
      console.log('finRes')
      return true
    })
  })
})

//This function takes care of adding the notification badge on the host app when a new guest accepts the host's post
exports.notifyHostOnNewGuest = functions.database
.ref('/networks/{networkId}/allPosts/{pushId}/acceptorIds/{acceptorId}')
.onCreate((snapshot, context) => {
  const {pushId, networkId, acceptorId} = context.params;
  if (!pushId || !networkId || !acceptorId) {
      return console.log('missing mandatory params')
  }

  //Get the host ID from the post object
  return admin.database().ref(`networks/${networkId}/allPosts/${pushId}`).once('value', (postSnapshot) => {
    let post = postSnapshot.val()
    //Increment total interested count for the client. this is used for notifying the client as well as for showing badge in clients app
    return admin.database().ref(`/users/${post.hostId}/totalInterested`).transaction(function(totalInterested){
      return (totalInterested || 0) + 1;
    });
  })
})


// Send push notification to the host of a livePost whenever interestedCount increments in a multiple of 3
  exports.sendPushNotificationToHost = functions.database
  .ref('/networks/{networkId}/livePosts/{pushId}/interestedCount')
  .onUpdate((change, context) => {
      const {pushId, networkId} = context.params;
      if (!pushId || !networkId) {
          return console.log('missing mandatory params for sending push.')
      }
      let interestedCount = change.after.val();

      //Hotfix
      if(change.after.val() === 0) return 0;

      if( (interestedCount % 3) != 0 ){
        console.log('interestedCount is updated but is not a multiple of 3')
        return 0;
      }
      console.log('interestedCount is a multiple of 3. Sending Push.')

      const payload = {
          notification: {
              title: `${interestedCount}+ people are interested in your activity!`,
              body: `Tap to see who`
          },
          data: {
              taskId: pushId,
              notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
          }
      };

      return admin.database().ref(`/networks/${networkId}/livePosts/${pushId}/hostId`).once('value', (snapshot) => {
        let hostId = snapshot.val();
        return admin.database().ref(`/users/${hostId}/deviceTokens`).once('value', (tokenSnapshot) => {
          let deviceTokens = tokenSnapshot.val()
          if(deviceTokens != null){
            return admin.messaging().sendToDevice(deviceTokens, payload);
          }else{
            console.log('deviceTokens is null');
            return 0;
          }
        })
      })
  });



// TODO: Change onCreate to onUpdate
// This function sends push notifications when there are new unread chat messages for this user.
exports.sendUnreadPushNotification = functions.database
.ref('/users/{userId}/messages/{pushId}/unreadCount')
.onUpdate((change, context) => {
    const pushId = context.params.pushId;
    const userId = context.params.userId;
    if (!pushId || !userId) {
        console.log('missing mandatory params for sending push.')
        return;
    }
    if( change.after.val() > change.before.val() ){
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
    }else{
      console.log('change.after.val() is not greater than change.before.val(). Exiting')
      return 0;
    }

});

// TODO : Debug. Function is throwing errors
//This function sends push notifications when there are new unread chat messages for this user. This function is not working as of now
// NEW NOTE : only sending to the first user. probably a problem with an extra return. Check history.
  exports.sendFinalizedListNotification = functions.database
  .ref('/networks/{networkId}/allPosts/{pushId}/confirmedGuests/{userId}')
  .onCreate((snapshot, context) => {
      const {pushId, networkId, userId} = context.params;
      if (!pushId || !networkId || !userId) {
          return console.log('missing mandatory params for sending push.')
      }

      let deviceTokens = []
      const userDevicePromise = admin.database().ref(`/users/${userId}`).once('value')
      return Promise.all([userDevicePromise]).then(results => {
        // Terminate here if the client does not have any device IDs.
        let userItem = results[0].val();
        if(!userItem.hasOwnProperty('deviceTokens') || !userItem.deviceTokens.length){
          console.log('User does not have device ID.');
          return;
        }
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
        console.log('Sending Finalize List notification to ', userItem.deviceTokens);
        return admin.messaging().sendToDevice(userItem.deviceTokens, payload);
      })
  });

/*
  exports.finalizeGuestListOps = functions.database
  .ref('/networks/{networkId}/allPosts/{pushId}/confirmedGuests')
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

        admin.database().ref(`networks/${networkId}/allPosts/${pushId}`).once('value', (postSnapshot) => {
          let post = postSnapshot.val()

          confGuestItems.map(guest => {
            admin.database().ref(`/users/${guest.id}/posts/guest/${pushId}`).update(post)
          })

        })


  });

  */

  exports.onConfirmGuest = functions.database
  .ref('/networks/{networkId}/allPosts/{pushId}/confirmedGuests/{userId}')
  .onCreate((snapshot, context) => {
      const pushId = context.params.pushId;
      const userId = context.params.userId;
      const networkId = context.params.networkId;
      if (!pushId || !userId || !networkId) {
          return console.log('missing mandatory param pushId for sending push.')
      }
      return admin.database().ref(`networks/${networkId}/allPosts/${pushId}`).once('value', (postSnapshot) => {
        let post = postSnapshot.val()
        return admin.database().ref(`/users/${userId}/posts/guest/${pushId}`).update(post)
      })

    });

  exports.addLivePosts = functions.database
  .ref('/networks/{networkId}/allPosts/{postId}/')
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
  .ref('networks/{networkId}/allPosts/{postId}')
  .onUpdate((change, context) => {
      const {postId, networkId} = context.params;
      if (!postId || !networkId) {
          return console.log('missing mandatory params for sending push.')
      }
      console.log('change.before.val().status :', change.before.val().status);
      console.log('change.after.val().status :', change.after.val().status);
      /*
      //if the post is no longer live, remove it from the livePosts reference object
      if(change.before.val().status == 0 && change.after.val().status != 0){
        console.log('Post no longer live. Removing it from livePosts.')
        return admin.database().ref(`networks/${networkId}/livePosts/${postId}`).remove();
      }

      if(change.after.val().status > 0){
        console.log('Post status 1. Removing it from livePosts.')
        return admin.database().ref(`networks/${networkId}/livePosts/${postId}`).remove();
      }
      */

      let post = change.after.val();

      if(post.status > 0){
        //Since the post's guest list is finalized, it is no longer in livePosts, so we don't need to update livePosts.
        //we remove it from livePosts
        console.log('post status > 0. Removing from livePosts')
        admin.database().ref(`networks/${networkId}/livePosts/${postId}`).remove();

        console.log('Post change detected.')
        //Update the duplicate post for the host
        return admin.database().ref(`/users/${post.hostId}/posts/host/${postId}`).update(post).then(res => {
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
        return admin.database().ref(`/networks/${networkId}/livePosts/${postId}`).update(post).then(res => {
          return admin.database().ref(`/users/${post.hostId}/posts/host/${postId}`).update(post)
        })
      }

  });

  exports.onDeletePost = functions.database
  .ref('networks/{networkId}/allPosts/{postId}')
  .onDelete((snapshot, context) => {
      const {postId, networkId} = context.params;
      if (!postId || !networkId) {
          return console.log('missing mandatory params for sending push.')
      }
      let post = snapshot.val();
      //we remove it from livePosts
      admin.database().ref(`networks/${networkId}/livePosts/${postId}`).remove();
      //Delete the duplicate post for the host
      return admin.database().ref(`/users/${post.hostId}/posts/host/${postId}`).remove().then(res => {
        console.log('Deleted host post')
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
          promise = admin.database().ref(`/users/${guestId}/posts/guest/${post.id}`).remove();
          promises.push(promise);
        }
        return Promise.all(promises).then(() => {
          console.log('final Promise returned')
        })
      })
  });
