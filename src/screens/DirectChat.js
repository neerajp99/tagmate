import React, { Component, PropTypes } from 'react';
import { Text, View, StyleSheet, Platform } from "react-native";
import firebase from "react-native-firebase";
import {connect} from 'react-redux';
import {chatScreenMounted, chatScreenUnmounted} from '../actions';
import {getAvatar} from '../lib/firebaseUtils'
import ChatLibDirect from "../lib/ChatLibDirect";
import ChatMessage from '../lib/ChatMessage';
import OfflineNotice from './OfflineNotice';

import emojiUtils from 'emoji-utils';
import { GiftedChat, Bubble } from "react-native-gifted-chat";

class DirectChat extends React.Component {
  selfAvatar = "";

  constructor(props){
    super(props);
    this.state = {
      name: this.props.navigation.state.params.name,
      networkId: this.props.navigation.state.params.networkId,
      targetUid: this.props.navigation.state.params.targetUid
    };
  }
  state = {
    messages: []
  };

  componentWillMount() {
    //ChatLibDirect.resetUnread(this.state.taskId);
  }

  componentDidMount() {
    ChatLibDirect.setTargetUid(this.state.targetUid);
    ChatLibDirect.setNetworkId(this.state.networkId);
    ChatLibDirect.resetUnread(this.state.targetUid);
    this.props.chatScreenMounted();

    firebase.analytics().setCurrentScreen('DirectChat');
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

    ChatLibDirect.loadMessages(message => {
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
            ChatLibDirect.sendMessage(message, this.state.targetUid);
          }}
          user={{
            _id: ChatLibDirect.getUid(),
            name: ChatLibDirect.getName(),
            avatar: ChatLibDirect.getAvatar()
          }}
        />
      </View>
    );
  }
  componentWillUnmount() {
    ChatLibDirect.resetUnread(this.state.targetUid);
    this.props.chatScreenUnmounted();
    ChatLibDirect.closeChat();
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f7f9fa"
  }
});

//mapStateToProps not needed yet

export default connect(null, {chatScreenMounted, chatScreenUnmounted})(DirectChat);
