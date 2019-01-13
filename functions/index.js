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
                        title: 'New Service Requested',
                        body: `A new request is there for ${serviceObj.title} service.`
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
                    // Terminate here if the server does not have any Whatsapp number.
                    if(!server.hasOwnProperty('whatsapp')) return console.log('Server does not have Whatsapp.')
                    const payload = {
                        notification: {
                            title: 'Your savior is here!',
                            body: `Open to contact your request's acceptor.`
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



    exports.sendCancellationPushNotification = functions.database
    .ref('/servicesRequests/{pushId}')
    .onUpdate((snapshot, context) => {
        const pushId = context.params.pushId;
        if(!pushId){return console.log('missing mandatory params for sending push.')}
        const {status, clientId, serverId} = snapshot.val();
        if(status != 3 && status != 4) return console.log('not a cancellation');
        var userPromise = 0;
        if(status == 3) userPromise = admin.database().ref(`/users/${serverId}`).once('value')
        else userPromise = admin.database().ref(`/users/${clientId}`).once('value')
        return Promise.all([userPromise])
            .then(results => {
                const user = results[0].val();
                if(!user.hasOwnProperty('deviceTokens') || !user.deviceTokens.length) return console.log('No device tokens.')
                const payload = {
                        notification: {
                            title: (status == 3)?'Requester cancelled the task!':'Your savior ditched you!',
                            body: `Tap to view the cancelled task.`
                        },
                        data: {
                            taskId: pushId,
                            notifType: 'OPEN_DASHBOARD_DETAILS', // To tell the app what kind of notification this is.
                        }
                    };
                    return admin.messaging().sendToDevice(user.deviceTokens, payload);                
                
            })
    });
