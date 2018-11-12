// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _ = require('lodash');

// initializes your application
admin.initializeApp();

exports.sendPushNotification = functions.database
    .ref('/servicesRequests/{pushId}')
    .onCreate((snapshot, context) => {
        const {clientId, id: requestId, serviceId} = snapshot.val();
        if (!clientId || !requestId || !serviceId) {
            return console.log('missing mandatory params for sending push.')
        }
        let clientUser = {id: clientId}, deviceTokens = []
        const getUsersPromise = admin.database().ref(`/users`).once('value')
        const serviceDetailsPromise = admin.database()
            .ref(`/services/${serviceId}`).once('value')

        return Promise.all([getUsersPromise, serviceDetailsPromise])
            .then(results => {
                const serviceObj = results[1].val() || {}
                const usersObj = results[0].val() || {}
                const iDs = Object.keys(usersObj)
                for (const id of iDs) {
                    let user = usersObj[id] || {}
                    if (id === clientId) {
                        Object.assign(clientUser, user)

                    } else if (user.hasOwnProperty('services')
                        && user.hasOwnProperty('deviceTokens')
                        && _.includes(user.services, serviceId)) {
                        deviceTokens = (user.deviceTokens || [])
                            .concat(deviceTokens || [])
                    }
                }

                // Notification details.
                const payload = {
                    notification: {
                        title: 'New Service Requested',
                        body: `A new request is there for ${serviceObj.title} service.`
                    },
                    data: {
                        notifType: 'SERVICE_REQUEST', // for future if we add notif for more things, this type will let us identify
                        serviceId
                    }

                };

                if (!Array.isArray(deviceTokens) || !deviceTokens.length) {
                    return console.log('no user found to send push to.')
                }
                // Send notifications to all tokens.
                return admin.messaging()
                    .sendToDevice(deviceTokens, payload);
            })
    });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
