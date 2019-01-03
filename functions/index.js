// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const _ = require('lodash');

// initializes your application
admin.initializeApp();

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from a Serverless Database!");
});

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
                    .sendToDevice(_.uniq(deviceTokens), payload);
            })
    });


    exports.sendPushNotificationToRequester = functions.database
    .ref('/servicesRequests/{pushId}/serverId')
    .onCreate((snapshot, context) => {
        const pushId = context.params.pushId;
        if (!pushId) {
            return console.log('missing mandatory params for sending push.')
        }
        let deviceTokens = []
        const requesterIdPromise = snapshot.ref.parent.child('clientId').once('value')
        const acceptorIdPromise = snapshot.ref.parent.child('serverId').once('value')
        return Promise.all([requesterIdPromise, acceptorIdPromise])
            .then(results => {
                const clientId = results[0].val()
                const serverId = results[1].val()
                const clientDevicesPromise = admin.database().ref(`/users/${clientId}`).once('value')
                const serverWhatsappPromise = admin.database().ref(`/users/${serverId}`).once('value')
                return Promise.all([clientDevicesPromise, serverWhatsappPromise])
                .then(finResults => 
                {
                    const client = finResults[0].val()
                    const server = finResults[1].val()
                    if(!client.hasOwnProperty('deviceTokens') || !client.deviceTokens.length) return console.log('No clients.')
                    if(!server.hasOwnProperty('whatsapp')) return console.log('Server does not have Whatsapp.')
                    const payload = {
                        notification: {
                            title: 'Your savior is here!',
                            body: `Open to contact your request's acceptor.`
                        },
                        data: {
                            notifType: 'FOUND_ACCEPTOR', // for future if we add notif for more things, this type will let us identify
                            whatsapp: server.whatsapp
                        }
                    };
                    return admin.messaging().sendToDevice(client.deviceTokens, payload);
                })
            })
    });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
