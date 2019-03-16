import firebase from "react-native-firebase";

class ChatLib {
  uid = "";
  taskId = "";
  messagesRef = null;
  constructor() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setUid(user.uid);
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
          name: message.user.name
        }
      });
    };
    this.messagesRef.limitToLast(20).on("child_added", onReceive);
  }
  // send the message to the Backend
  sendMessage(message) {
    for (let i = 0; i < message.length; i++) {
      this.messagesRef.push({
        text: message[i].text,
        user: message[i].user,
        createdAt: firebase.database.ServerValue.TIMESTAMP
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
