import firebase from "react-native-firebase";
import {getAvatar, getFullName} from './firebaseUtils'

class ChatLib {
  uid = "";
  name = "";
  taskId = "";
  avatar = "";
  messagesRef = null;
  constructor() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setUid(user.uid);
        getAvatar(user.uid).then(avatarURL => {
          this.avatar = avatarURL;
          console.log('got avatar: ', avatarURL)
        })
        getFullName(user.uid).then(fullName => {
          this.name = fullName;
          console.log('got fullName: ', fullName)
        })
      } else {
        console.log('user not logged in: ChatLib');
      }
    });
  }
  setUid(value) {
    this.uid = value;
  }

  setTaskId(value) {
    this.taskId = value;
    console.log('setTaskId');
  }

  getUid() {
    return this.uid;
  }

  getName() {
    return this.name;
  }

  getAvatar() {
    return this.avatar;
  }

  networkCheck = (userId, bio) => new Promise((resolve, reject) => {
      try {
            setTimeout(() => {
              return fetch('http://www.google.com')
                .then((response) => {
                  resolve(true)
                })
                .catch((err) => {
                  resolve(false)
                });
            }, 200);
      } catch (e) {
          reject(false)
      }
  })


  // retrieve the messages from the Backend
  loadMessages(callback) {
    console.log(this.taskId);
    this.messagesRef = firebase.database().ref('/messages/' + this.taskId);
    this.messagesRef.off();
    const onReceive = data => {
      const message = data.val();
      callback({
        _id: data.key,
        text: message.text,
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.user._id,
          name: message.user.name,
          avatar: message.user.avatar
        }
      });
    };
    this.messagesRef.limitToLast(20).on("child_added", onReceive);
  }
  // send the message to the Backend
  sendMessage(message, userList) {
    this.networkCheck().then(online =>{
      if(online){
        for (let i = 0; i < message.length; i++) {
          this.messagesRef.push({
            text: message[i].text,
            user: message[i].user,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          });
        }
        this.incrementUnread(userList);
      }else{
        alert('Please check your internet connection and try again')
      }
    })

  }

  //Reset unread msg count for this user
  resetUnread(taskId){
    const {currentUser: {uid} = {}} = firebase.auth()
    ref = firebase.database().ref(`/users/${uid}/messages/${taskId}`);
    ref.set({taskId: taskId, unreadCount: 0});
  }

  //Increment unread msg count for all users
  incrementUnread(userList){

    for(let i = 0; i< userList.length; i++){
      console.log('I have incremented unread counts for these users: ', userList[i]);

      firebase.database().ref(`/users/${userList[i]}/messages/${this.taskId}/unreadCount`).transaction(function(unreadCount){
        return (unreadCount || 0) + 1;
      });
    }

  }


  // close the connection to the Backend
  closeChat() {
    if (this.messagesRef) {
      this.messagesRef.off();
    }
  }
}

export default new ChatLib();
