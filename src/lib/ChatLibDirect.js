import firebase from "react-native-firebase";
import {getUserThumbnail, getFullName, resetUnreadCountDirect} from './firebaseUtils'

class ChatLibDirect {
  uid = "";
  name = "";
  targetUid = "";
  avatar = "";
  messagesRef = null;
  constructor() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setUid(user.uid);
        getUserThumbnail(user.uid).then(avatarURL => {
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

  setNetworkId(value) {
    this.networkId = value;
  }

  setTargetUid(value) {
    this.targetUid = value;
    console.log('setTargetUid');
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
              return fetch('https://www.google.com')
                .then((response) => {
                  resolve(true)
                })
                .catch((err) => {
                  resolve(false)
                });
            }, 150);
      } catch (e) {
          reject(false)
      }
  })


  // retrieve the messages from the Backend
  loadMessages(callback) {
    let roomName = (this.uid<this.targetUid ? this.uid+'_'+this.targetUid : this.targetUid+'_'+this.uid);

    this.messagesRef = firebase.database().ref(`directMessages/${roomName}`);
    console.log('this.uid: ', this.uid)
    console.log('this.targetUid: ', this.targetUid)
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
  sendMessage(message, uid) {
    this.networkCheck().then(online =>{
      if(online){
        for (let i = 0; i < message.length; i++) {
          this.messagesRef.push({
            text: message[i].text,
            user: message[i].user,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          });
        }

        const incrementUnreadDirect = firebase.functions().httpsCallable('incrementUnreadDirect');
        incrementUnreadDirect({uid: this.uid, targetUid: this.targetUid})
        .then(({ data }) => {
          console.log('[Client] Server successfully posted')
        })
        .catch(HttpsError => {
            console.log(HttpsError.code); // invalid-argument
        })


        //this.incrementUnread(userList); //local function not using. Using cloud function instead
      }else{
        alert('Please check your internet connection and try again')
      }
    })

  }

  //Reset unread msg count for this user
  resetUnread(targetUid){
    const {currentUser: {uid} = {}} = firebase.auth()
    resetUnreadCountDirect(uid, targetUid);
  }


  // close the connection to the Backend
  closeChat() {
    if (this.messagesRef) {
      this.messagesRef.off();
    }
  }
}

export default new ChatLibDirect();
