import React, {Component} from 'react';
import {FlatList, View, ActivityIndicator, StyleSheet, Linking, Alert, Share, ScrollView, Dimensions} from 'react-native';
import {markRequestCancelled} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialComIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, Card, ListItem, Text, Divider, Badge, withBadge } from 'react-native-elements';
import * as _ from 'lodash';
import {getNetworkId, getWhatsapp, getName, getCoins, hasOptedOutAsGuest} from '../lib/firebaseUtils.js';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_TWO} from './style/AdourStyle'
import OfflineNotice from './OfflineNotice';

const { width: WIDTH } = Dimensions.get('window')

class ViewGuestList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fetching:true,
      confirmedGuestList:this.props.navigation.state.params.confirmedGuestList
    }
  }

  componentDidMount(){
    this._isMounted = true;
    firebase.analytics().setCurrentScreen('ViewGuestList');
  }

  componentWillUnmount()
  {
    this._isMounted = false;
  }

  openProfile = (uid) =>
  {
    this.props.navigation.navigate('ViewProfile',{profileUid: uid})
  }


  renderGuests = ({item}) => {
      const {id, fullName, guestStatus, thumbnail} = item;

      return (
        <View>
        {guestStatus != 3 && <ListItem
          title={fullName}
          titleStyle={adourStyle.listItemText}
          chevron={false}
          onPress={() => this.openProfile(id)}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftAvatar={{ source: { uri: thumbnail } }}
        />}
        {guestStatus == 3 && <ListItem
          title={fullName + " has left"}
          titleStyle={adourStyle.greyText}
          chevron={false}
          containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 2}}
          leftAvatar={{ source: { uri: thumbnail } }}
        />}
        </View>
      )
  }

  render()
  {
    const {item, confirmedGuestList, unreadChatCount, optedOut} = this.state;

    return (
      <ScrollView>
      <View style={styles.mainContainer}>
      <OfflineNotice />
      <Card>
        <FlatList
            data={confirmedGuestList}
            extraData={confirmedGuestList}
            renderItem={this.renderGuests}
            keyExtractor={(confirmedGuestList, index) => confirmedGuestList.id}
        />
      </Card>
      </View>
      </ScrollView>
    )
  }
}

export {ViewGuestList};

/*
* Styles used in this screen
* */
const styles = StyleSheet.create({
    container: {
      position:'relative',
      top:0,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    subContent: {
      marginTop: 2,
      marginBottom: 10
    },
    cardSubtitle: {
      marginBottom: 10,
      marginLeft: 18
    },
    cardSubtitleText: {
      fontSize: 16,
      fontWeight: '100'
    },
    buttonContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#eceff1'
    },
    progressContainer: {
        width: 60,
        height: 60,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -30,
        marginTop: -30
    },
    rowItem: {
        alignSelf: 'stretch',
        justifyContent: 'flex-end',
        borderBottomColor: '#5d5d5d',
        borderBottomWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    listContainer: {
        flex: 1,
    },
    textTitle: {
      fontSize: 18,
      fontWeight: '200',
      marginBottom: 5,
    },
    textDescription: {
      fontSize: 16,
      fontWeight: '100',
      marginLeft:5
    },
    contentContainer: {
        width: '100%'
    }
})
