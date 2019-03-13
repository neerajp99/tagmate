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

// This function pushes notification every time a new service request is created to those who offer that service.
exports.sendPushNotification = functions.database
    .ref('/servicesRequests/{pushId}')
    .onCreate((snapshot, context) => {
        const {clientId, id: requestId, serviceId} = snapshot.val();
        if (!clientId || !requestId || !serviceId) {
            return console.log('missing mandatory params for sending push.')
        }
        let clientUser = {id: clientId}, deviceTokens = []
        const getUsersPromise = admin.database().ref(`/users`).once('value')
        const serviceDetailsPromise = admin.database().ref(`/services/${serviceId}`).once('value')

        return Promise.all([getUsersPromise, serviceDetailsPromise])
            .then(results => {
                const serviceObj = results[1].val() || {}
                const usersObj = results[0].val() || {}
                const iDs = Object.keys(usersObj)
                // Running over all users one by one and putting their device IDs into a list if they offer the requested service.
                for (const id of iDs) {
                    let user = usersObj[id] || {}
                    if (id === clientId) {
                        Object.assign(clientUser, user)
                    }
                    else if (user.hasOwnProperty('services')
                        && user.hasOwnProperty('deviceTokens')
                        && _.includes(user.services, serviceId)) {
                        deviceTokens = (user.deviceTokens || [])
                            .concat(deviceTokens || [])
                    }
                }

                // Notification details.
                const payload = {
                    notification: {
                        title: `Interested in ${serviceObj.title}?`,
                        body: `Tap to meet someone new :)`
                    },
                    data: {
                        notifType: 'SERVICE_REQUEST', // To tell the app what kind of notification this is.
                        serviceId
                    }

                };

                if (!Array.isArray(deviceTokens) || !deviceTokens.length) {
                    return console.log('no user found to send push to.')
                }
                // Send notifications to all unique tokens.
                return admin.messaging()
                    .sendToDevice(_.uniq(deviceTokens), payload);
            })
    });

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

    // WIP This function sends push notifications related to chat and messaging.
        exports.sendChatPushNotification = functions.database
        .ref('/messages/{pushId}/{newMessage}')
        .onCreate((snapshot, context) => {
            const pushId = context.params.pushId;
            if (!pushId) {
                return console.log('missing mandatory params for sending push.')
            }
            const serviceRequestPromise = admin.database().ref(`/servicesRequests/${pushId}`).once('value')
            let deviceTokens = []
            //const requestPromise = snapshot.ref.parent.once('value')
            // Once we have clientId and serverId:
            return Promise.all([serviceRequestPromise])
                .then(results => {
                    var item = results[0].val()
                    // Terminate here if there is no server
                    if(!item.hasOwnProperty('serverId')) return console.log('No server')

                    const {serverId, clientId} = item
                    const clientDevicePromise = admin.database().ref(`/users/${clientId}`).once('value')
                    const serverDevicePromise = admin.database().ref(`/users/${serverId}`).once('value')
                    // Once we have device IDs of client (requester) and Whatsapp number of server (acceptor)
                    return Promise.all([clientDevicePromise, serverDevicePromise])
                    .then(finResults =>
                    {
                        const client = finResults[0].val()
                        const server = finResults[1].val()
                        // Terminate here if the client does not have any device IDs.
                        if(!client.hasOwnProperty('deviceTokens') || !client.deviceTokens.length) return console.log('No clients.')
                        const payload = {
                            notification: {
                                title: 'You have a new message!',
                                body: `Tap to respond`
                            },
                            data: {
                                taskId: item.id,
                                notifType: 'OPEN_CHAT', // To tell the app what kind of notification this is.
                            }
                        };
                        return admin.messaging().sendToDevice(client.deviceTokens, payload);
                    })
                })
        });


    exports.sendCancellationPushNotification = functions.database
    .ref('/servicesRequests/{pushId}')
    .onUpdate((snapshot, context) => {
        const pushId = context.params.pushId;
        if(!pushId){return console.log('missing mandatory params for sending push.')}
        const {status, clientId, serverId} = snapshot.after.val();
        var prev = snapshot.before.val().status;
        if(prev != 1 && (status != 3 || status != 4)) return console.log('not a cancellation');
        var userPromise = 0;
        if(status == 3) userPromise = admin.database().ref(`/users/${serverId}`).once('value')
        else userPromise = admin.database().ref(`/users/${clientId}`).once('value')
        return Promise.all([userPromise])
            .then(results => {
                const user = results[0].val();
                if(!user.hasOwnProperty('deviceTokens') || !user.deviceTokens.length) return console.log('No device tokens.')
                const payload = {
                        notification: {
                            title: (status == 3)?'Requester cancelled the task!':'Activity cancelled!',
                            body: `Tap to view the cancelled activity.`
                        },
                        data: {
                            taskId: pushId,
                            notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
                        }
                    };
                    return admin.messaging().sendToDevice(user.deviceTokens, payload);

            })
    });
