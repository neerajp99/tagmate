import React, { Component, PropTypes } from 'react';
import { Text, View, StyleSheet, Platform } from "react-native";
import firebase from "react-native-firebase";
import {connect} from 'react-redux';
import {chatScreenMounted, chatScreenUnmounted} from '../actions';
import {getAvatar} from '../lib/firebaseUtils'
import ChatLib from "../lib/ChatLib";
import ChatMessage from '../lib/ChatMessage';
import OfflineNotice from './OfflineNotice';

import emojiUtils from 'emoji-utils';
import { GiftedChat, Bubble } from "react-native-gifted-chat";

class ActivityChat extends React.Component {
  selfAvatar = "";

  constructor(props){
    super(props);
    this.state = {
      name: this.props.navigation.state.params.name,
      taskId: this.props.navigation.state.params.taskId,
      userList: this.props.navigation.state.params.userList,
    };
  }
  state = {
    messages: []
  };

  componentWillMount() {
    //ChatLib.resetUnread(this.state.taskId);
  }

  componentDidMount() {
    ChatLib.setTaskId(this.state.taskId);
    ChatLib.resetUnread(this.state.taskId);
    this.props.chatScreenMounted();

    firebase.analytics().setCurrentScreen('ActivityChat');
    /*
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        getAvatar(user.uid).then(avatarURL => {
          this.selfAvatar = avatarURL;
        })
      } else {
        console.log('user not logged in: ActivityLib');
      }
    });
    */

    ChatLib.loadMessages(message => {
      this.setState(previousState => {
        return {
          messages: GiftedChat.append(previousState.messages, message)
        };
      });
    });
  }

  renderBubble (props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#9263cc'
          }
        }}
      />
    )
  }

  renderMessage(props) {
  const { currentMessage: { text: currText } } = props;

  let messageTextStyle;

  // Make "pure emoji" messages much bigger than plain text.
  if (currText && emojiUtils.isPureEmojiString(currText)) {
    messageTextStyle = {
      fontSize: 28,
      // Emoji get clipped if lineHeight isn't increased; make it consistent across platforms.
      lineHeight: Platform.OS === 'android' ? 34 : 30,
    };
  }

    return (
      <ChatMessage {...props} messageTextStyle={messageTextStyle} />
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <OfflineNotice />
        <GiftedChat
          messages={this.state.messages}
          renderMessage={this.renderMessage}
          renderAvatarOnTop={true}
          onPressAvatar={(user) => this.props.navigation.navigate('ViewProfile',{profileUid: user._id})}
          onSend={message => {
            ChatLib.sendMessage(message, this.state.userList);
          }}
          user={{
            _id: ChatLib.getUid(),
            name: ChatLib.getName(),
            avatar: ChatLib.getAvatar()
          }}
        />
      </View>
    );
  }
  componentWillUnmount() {
    ChatLib.resetUnread(this.state.taskId);
    this.props.chatScreenUnmounted();
    ChatLib.closeChat();
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#d9dff9"
  }
});

//mapStateToProps not needed yet

export default connect(null, {chatScreenMounted, chatScreenUnmounted})(ActivityChat);
