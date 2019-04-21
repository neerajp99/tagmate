import React, { Component, PropTypes } from 'react';
import { Text, View, StyleSheet } from "react-native";

import ChatLib from "../lib/ChatLib";

import { GiftedChat, Bubble } from "react-native-gifted-chat";

class ActivityChat extends React.Component {
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
    ChatLib.resetUnread(this.state.taskId);
  }

  componentDidMount() {
    ChatLib.setTaskId(this.state.taskId);
    ChatLib.resetUnread(this.state.taskId);
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

  render() {
    return (
      <View style={styles.container}>
        <GiftedChat
          messages={this.state.messages}
          renderBubble={this.renderBubble}
          onSend={message => {
            ChatLib.sendMessage(message, this.state.userList);
          }}
          user={{
            _id: ChatLib.getUid(),
            name: this.state.name
          }}
        />
      </View>
    );
  }
  componentWillUnmount() {
    ChatLib.resetUnread(this.state.taskId);
    ChatLib.closeChat();
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#d6d6d6"
  }
});
export default ActivityChat;
