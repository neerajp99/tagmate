import React from 'react';
import {View} from 'react-native';
import { Badge } from 'react-native-elements';
import {getTotalUnread, getTotalInterested} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';


export default class IconWithBadge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      unreadNotifs: 0,
      totalInterestCount: 0,
    }
  }
  componentDidMount(){
    const {currentUser: {uid} = {}} = firebase.auth()
    getTotalUnread(uid).then(result => {
      this.setState({unreadNotifs: result})
    });
    getTotalInterested(uid).then(result => {
      this.setState({totalInterestCount: result})
    })

    this.liveUpdates();
  }

  liveUpdates = () => {
    const {currentUser: {uid} = {}} = firebase.auth()

    //Live update for unread chat count
    let ref = firebase.database().ref(`users/${uid}/messages/`);
    ref.on('value', (snapshot) => {
      getTotalUnread(uid).then(result => {
        this.setState({unreadNotifs: result})
      });
    })

    //Live update for interested people count
    let interestRef = firebase.database().ref(`users/${uid}/totalInterested/`);
    interestRef.on('value', (snapshot) => {
      getTotalInterested(uid).then(result => {
        this.setState({totalInterestCount: result})
      });
    })

  }

  render() {

    return (
      <View>
        {(this.state.unreadNotifs > 0) && <Badge status="success" value={this.state.unreadNotifs} containerStyle={{ position: 'absolute', top: -34, right: -18 }} />}
        {(this.state.totalInterestCount > 0) && <Badge status="primary" value={this.state.totalInterestCount} containerStyle={{ position: 'absolute', top: -34, right: -5 }} />}
        </View>
    );
  }
}
