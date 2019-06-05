import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {serverExists, getNetworkId, saveDeviceToken, addServer, appendHiddenPosts, alreadyAccepted, addAcceptor, removeSelfHostedPosts, getAcceptors, getHiddenPosts} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import Notification from '../lib/Notification';
import { Button, ListItem, Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import {connect} from "react-redux";
import * as _ from 'lodash';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_THREE, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';
import CardStack, { Card as SwipableCard } from 'react-native-card-stack-swiper';

const CUSTOM_IMG = "http://chillmateapp.com/assets/item_img/custom.jpg";

//Test commit

const { width: WIDTH } = Dimensions.get('window')
let uid;

class HomeScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myTasks: [],
            hiddenPosts: [],
            fetching: false,
        };
        this.getMyTasks = this.getMyTasks.bind(this);
    }

    componentDidMount(){
        this._isMounted = true;
        this.setState({fetching:true});
        let user = firebase.auth().currentUser;
        if (user != null) {
          uid = user.uid;
        } else {
          this.props.navigation.navigate('Login')
        }
        // TEMPORARY
        //getAcceptors("testServiceRequest").then(response => {
        //  console.log("Returned from getAcceptors: ", response);
        //})
        //alreadyAccepted("ShivamGupta500", "testServiceRequest").then(accptBool => {
        //  console.log('Returned from alreadyAccepted (expected true): ', accptBool)
        //})
        //addAcceptor("VineetNand999", "testServiceRequest"); //TEMPORARY

        // Keep updating tasks
        getHiddenPosts(uid).then(hiddenPostList => {
          this.setState({hiddenPosts: hiddenPostList});

          getNetworkId(uid).then(networkId => {
            this.setState({networkId: networkId});
            this.getMyTasks();
          })
        })
        this.tokenFunc(uid);
    }
    componentWillUnmount()
    {
        this._isMounted = false;
    }

    async tokenFunc(uid) {
      // configure push notification capability & get deviceToken
      Notification.configure((token) => {
        saveDeviceToken(uid, token)
      })

      //listener to listen token refresh
      this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(token => {
          Notification.onTokenRefresh(token)
          saveDeviceToken(uid, token)
      })
    }

    userGuideContainer = () =>
    {
      if(this.state.myTasks.length == 0) {
          return <View style={{marginLeft: 20, marginRight: 18, marginTop: 20}}>
                <Text style={adourStyle.guideText}>
                You will see other people's Chillmate meetup posts here. Your posts are on your Dashboard. {"\n"} {"\n"}
                </Text>
                <Button title="Create A Chillmate Meetup" titleStyle={adourStyle.buttonTextBold} buttonStyle={adourStyle.btnGeneral} disabled={this.state.disabledBtn} onPress={() => {this.props.navigation.navigate('Create')}}/>
                </View>
          }
    }
    /*
    * get all the task requests that this user can perform
    * */
    getMyTasks = () => {
        let networkId = this.state.networkId;
        let livePostsRef = firebase.database().ref(`networks/${networkId}/livePosts`)
        livePostsRef.on('child_added', (snapshot) => {

          let request  = snapshot.val()
          // Check if this request is not made by same user and it is not already decided upon by this user
          if(request.hostId != uid && !_.includes(this.state.hiddenPosts, request.id))
          {
            this.setState({myTasks:[request].concat(this.state.myTasks) , fetching: false});
          }
          if(this.state.fetching) this.setState({fetching:false});
        })
        if(this._isMounted) this.setState({fetching:false});

        livePostsRef.on('child_removed', (snapshot) => {
          console.log('child_removed, snapshot key is ', snapshot.key)
          this.setState({myTasks: this.state.myTasks.filter(item => item.id !== snapshot.key)});
        })

        //TODO: child_changed - interested Count may change


    }


    // Locally hide task by removing it from myTasks object in the state
    hideTask = (id) =>
    {
        let allTasks = [...this.state.myTasks];
        let filteredTasks = allTasks.filter(item => item.id != id);
        this.setState({myTasks:filteredTasks})
    }

    // The user has decided on this card and hence add this card to the user's hidden tasks list so that the app won't show it again
    decideOnPost = (id) =>
    {
        //this.hideTask(id);
        if(uid) appendHiddenPosts(uid, id);
    }

    // This function takes service request ID as parameter.
    // It first checks whether the service request is still up to be accepted.
    // If yes, it assigns it to the user and navigates him/her to the DashboardDetails screen.
    acceptTask = (item) =>
    {
        if(uid)
        {
            alreadyAccepted(uid, item.id).then(alreadyAcc => // Check if someone has already accepted the task {id}.
            {
                //this.hideTask(item.id);
                if(!alreadyAcc) // If the task is still not accepted by this user, add this user to the uid
                {
                    addAcceptor(uid, item.id, item.hostId).then(o =>
                    {
                      console.log('added as acceptor')
                        //this.hideTask(item.id);
                    });
                }
            });
        }
    }

    swipableRender(myTasks) {

      return myTasks.map((item) => {
        const {id, when, details, anonymous, customTitle, bgImage, created_at, hostName, interestedCount} = item;
        var detailsAvailable = true;

        if(details == "" || typeof details == "undefined") detailsAvailable = false

        let interestAvailable = false;
        let interestNumText = '';

        if(interestedCount > 0){
          interestNumText = `${interestedCount}+ interested`;
          interestAvailable = true;
        }

        let scheduledFor = "null"

        if(when != ""){
          scheduledFor = ("Scheduled for " + when);
        }

        return (
          <SwipableCard key={id} onSwipedLeft={() => this.decideOnPost(id)} onSwipedRight={() => this.acceptTask(item)}>
          <Card image={{uri: bgImage}} featuredTitle={customTitle} featuredTitleStyle={adourStyle.listItemText} >
              <ListItem
              title={anonymous? "Anonymous": hostName}
              titleStyle={adourStyle.listItemText}
              subtitle="Host"
              subtitleStyle={adourStyle.listItemText}
              chevron={false}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
            />

            { (scheduledFor != "null") && <Text style={adourStyle.defaultText}>{scheduledFor}</Text> }
            {interestAvailable && <Text style={adourStyle.defaultText}>{interestNumText}</Text>}
            <TimeAgo key={id} style={adourStyle.timeAgoText} time={created_at} />

            {
                detailsAvailable && <ListItem
                  subtitle={ details }
                  subtitleStyle={adourStyle.listItemText}
                  chevron={false}
                  containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                  subtitleProps={{ numberOfLines: 2 }}
                />
            }
              <View>
              </View>
              <View style={styles.buttonsContainer}>
              <View>
                <TouchableOpacity style={styles.btnReject} onPress={() => { this.swiper.swipeLeft() }} >
                  <Icon name={'thumbs-o-down'} size={25} color={'rgba(255, 255, 255, 1)'} />
                </TouchableOpacity>
              </View>
                <View>
                  <TouchableOpacity style={styles.btnAccept} onPress={() => { this.swiper.swipeRight() }}>
                    <Icon name={'thumbs-o-up'} size={25} color={'rgba(255, 255, 255, 1)'} />
                  </TouchableOpacity>
                </View>
              </View>

              </Card>
            </SwipableCard>
        )
      })

  }

    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const {id, when, details, customTitle, bgImage, anonymous, created_at, hostName, interestedCount} = item;
        var detailsAvailable = true;
        if(details == "" || typeof details == "undefined") detailsAvailable = false

        let interestAvailable = false;
        let interestNumText = '';

        if(interestedCount > 0){
          interestNumText = `${interestedCount}+ interested`;
          interestAvailable = true;
        }

        let scheduledFor = "null"

        if(when != ""){
          scheduledFor = ("Scheduled for " + when);
        }

        return (
          <View key={id}>
          <Card image={{uri: bgImage}} featuredTitle={customTitle} featuredTitleStyle={adourStyle.listItemText} >
          <View>
              <ListItem
              title={anonymous? "Anonymous": hostName}
              titleStyle={adourStyle.listItemText}
              subtitle="Host"
              subtitleStyle={adourStyle.listItemText}
              chevron={false}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
            />

            { (scheduledFor != "null") && <Text style={adourStyle.defaultText}>{scheduledFor}</Text> }
            {interestAvailable && <Text style={adourStyle.defaultText}>{interestNumText}</Text>}
            <TimeAgo key={id} style={adourStyle.timeAgoText} time={created_at} />

            {
                detailsAvailable && <ListItem
                  subtitle={ details }
                  subtitleStyle={adourStyle.listItemText}
                  chevron={false}
                  containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                  subtitleProps={{ numberOfLines: 2 }}
                />
            }

            </View>
              </Card>
            </View>
        )
    }

    render() {
        const {fetching, myTasks} = this.state
        return (
            <View style={styles.mainContainer}>
            <Card>
              <ListItem
                title="Create A Post"
                titleStyle={adourStyle.listItemText}
                leftIcon={{ name: 'edit' }}
                onPress={() => this.props.navigation.navigate('CreatePost')}
                containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              />
            </Card>
            <CardStack
                renderNoMoreCards={() => <View style={{marginTop: 50}}>
                                                  {fetching && <ActivityIndicator color={BRAND_COLOR_ONE} size={'large'}/>}
                                                  {!fetching && <Text style={adourStyle.cardOverText}>Check back later</Text>}
                                                  </View>}
                disableBottomSwipe={true}
                disableTopSwipe={true}
                ref={swiper => {
                  this.swiper = swiper
                }}
              >
              {this.swipableRender(myTasks)}
              </CardStack>



            </View>
        )
    }


}

export default HomeScreen;

/*
* Styles used in this screen
* */
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
    },
    progressContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginTop: 100
    },
    rowItem: {
        alignSelf: 'stretch',
        justifyContent: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 10
    },btnAccept:{
        width: ((WIDTH/2) - 35) ,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_COLOR_ONE
    },
    btnReject:{
        width: ((WIDTH/2) - 35),
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_COLOR_FOUR
    },
    footer:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
    },
    buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    flex: 2
    },
    listContainer: {
        flex: 1,
    },
    contentContainer: {
        width: '100%'
    }
})
