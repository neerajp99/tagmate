import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {serverExists, addServer, appendRejectedTask, getRelatedServices} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import { Button, ListItem, Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import * as _ from 'lodash';
import TimeAgo from 'react-native-timeago';
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';


const { width: WIDTH } = Dimensions.get('window')

class TaskScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myTasks: [],
            rejectedTasks: [],
            myServices: [],
            fetching: false,
        };
        this.getMyTasks = this.getMyTasks.bind(this);
    }

    componentDidMount(){

        this.setState({fetching:true});
        const {currentUser: {uid} = {}} = firebase.auth()
        // Keep updating tasks
        getRelatedServices(uid).then(services =>
        {
            this.setState(services);
            console.log('relatedServices:',services);
            // Keep updating tasks
            this.getMyTasks();
        });
    }

    /*
    * get all the task requests that this user can perform
    * */
    getMyTasks = () => {
        const {currentUser: {uid} = {}} = firebase.auth()

        // Load the service request IDs for the ones the user has rejected and push them to the state.
        firebase.database().ref(`users/${uid}/rejectedTasks`).on('child_added', (snapshot) => {
            var rejectId = snapshot.val();
            this.setState({myTasks: this.state.myTasks.filter(item => item.id !== rejectId), rejectedTasks: this.state.rejectedTasks.concat([rejectId])});
            console.log('triggered',this.state.rejectedTasks);
        });

        var ref = firebase.database().ref('servicesRequests')

        // When a service request object is added to the realtime database:
        ref.on('child_added', (snapshot) => {
            // To hide activity indicator:
            this.setState({fetching:false});
            var request = snapshot.val();
            if(
                request.clientId != uid // This request is not made by same user.
                && request.status == 0 // This request is still not taken by anyone
                && _.includes(this.state.myServices, request.serviceId) // This service is offered by user.
                && !_.includes(this.state.rejectedTasks, request.id) // Not rejected already
                )
                this.setState({myTasks:[request].concat(this.state.myTasks)});
        });

        // If a service request object is removed from the realtime database:
        ref.on('child_removed', (snapshot) => {
            this.setState({myTasks: this.state.myTasks.filter(item => item.id !== snapshot.key)});
        });

        // If an existing service request object is changed in the realtime database:
        ref.on('child_changed', (snapshot) => {
            var request = snapshot.val();
            if(
                request.clientId == uid // This request is not made by same user.
                || request.status != 0 // This request is still not taken by anyone
                || !_.includes(this.state.myServices, request.serviceId) // This service is offered by user.
                || _.includes(this.state.rejectedTasks, request.id) // Not rejected already
                )
            this.setState({myTasks: this.state.myTasks.filter(item => item.id !== request.id)});
        });

        // If there is a change noted in the services the user offers:
        firebase.database().ref(`users/${uid}/services`).on('value', (snapshot) => {
            this.setState({myServices: snapshot.val() || []});
            let myTaskss = this.state.myTasks;
            let toRemove = [];
            // Filter the currently shown service requests to adjust to the user's new choices:
            myTaskss.map(request =>
            {
                if(
                    request.clientId == uid // This request is not made by same user.
                    || request.status != 0 // This request is still not taken by anyone
                    || !_.includes(this.state.myServices, request.serviceId) // This service is offered by user.
                    || _.includes(this.state.rejectedTasks, request.id) // Not rejected already
                    )
                    toRemove.push(request.id);
            });
            this.setState({myTasks: this.state.myTasks.filter(item => !_.includes(toRemove, item.id))});
        })

    }


    // Locally hide task by removing it from myTasks object in the state
    hideTask = (id) =>
    {
        let allTasks = [...this.state.myTasks];
        let filteredTasks = allTasks.filter(item => item.id != id);
        this.setState({myTasks:filteredTasks})
    }

    // Filter the currently shown service requests to adjust to the user's new choices:
    // It hides the service request corresponding to the ID and appends the ID to user's list of rejected tasks.
    rejectTask = (id) =>
    {
        this.hideTask(id);
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid) appendRejectedTask(uid, id); // Write into databse that user {uid} rejected task {id}.
    }

    // This function takes service request ID as parameter.
    // It first checks whether the service request is still up to be accepted.
    // If yes, it assigns it to the user and navigates him/her to the DashboardDetails screen.
    acceptTask = (item) =>
    {
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid)
        {
            serverExists(item.id).then(exists => // Check if someone has already accepted the task {id}.
            {
                this.hideTask(item.id);
                if(!exists) // If the task is still not accepted by anyone, assign it to user {uid}.
                {
                    addServer(uid, item.id).then(whatsapp =>
                    {
                        this.props.navigation.navigate('DashboardDetails', {taskId: item.id});
                    });
                }
            });
        }
    }

    /*
    * render an item of the list
    * */
    renderItem = ({item}) => {
        const {serviceId, id, when, details, created_at} = item;
        var detailsAvailable = true;
        const {allServices} = this.state
        var serviceTitle = '---';
        allServices.map(service => {
            if(service.id == serviceId)
            {
                serviceTitle = service.title;
            }
        });
        if(details == "" || typeof details == "undefined") detailsAvailable = false
        return (
          <View key={id}>
          <Card>
              <ListItem
              title={serviceTitle}
              titleStyle={adourStyle.listItemText}
              hideChevron={true}
              containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
              rightTitle={<TimeAgo key={id} time={created_at} />}
              subtitleNumberOfLines={2}
            />
            {
                detailsAvailable && <ListItem
                  subtitle={ details }
                  subtitleStyle={adourStyle.listItemText}
                  hideChevron={true}
                  containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                  subtitleNumberOfLines={2}
                />
            }
            {/* HIDING WHEN TEXT BY DISABLING THE FOLLOWING CODE */}
            {/* subtitle={ "Needed by: "+(when) }  subtitleStyle={adourStyle.listItemText} */}
            {/*rightTitle={['Created ', <TimeAgo key={id} time={created_at} />]} */}
              <View>
              </View>
              <View style={styles.buttonsContainer}>
                <View>
                  <TouchableOpacity style={styles.btnAccept} onPress={() => { this.acceptTask(item) }}>
                    <Icon name={'check'} size={25} color={'rgba(255, 255, 255, 1)'} />
                  </TouchableOpacity>
                </View>
                <View>
                  <TouchableOpacity style={styles.btnReject} onPress={() => { this.rejectTask(id) }} >
                    <Icon name={'close'} size={25} color={'rgba(255, 255, 255, 1)'} />
                  </TouchableOpacity>
                </View>

              </View>

              </Card>
            </View>
        )
    }

    render() {
        const {fetching, myTasks} = this.state
        return (
            <View style={styles.mainContainer}>
                <FlatList
                    data={myTasks}
                    extraData={myTasks}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={BRAND_COLOR_ONE} size={'large'}/>
                    </View>
                }
            </View>
        )
    }


}

export {TaskScreen};

/*
* Styles used in this screen
* */
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
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
