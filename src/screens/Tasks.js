import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {getMyTasks, serverExists, addServer, appendRejectedTask} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase';
import { Button } from 'react-native-elements';
import * as _ from 'lodash';


class TaskScreen extends Component {
    state = {
        myTasks: [],
        fetching: false
    }

    componentWillMount(){
        this.getMyTasks()
    }

    componentDidMount(){
        // Keep new tasks coming
        this.taskInterval = setInterval(() => 
        {
            this.getMyTasks(true);
        }, 10000);
    }

    componentWillUnmount(){
        clearInterval(this.taskInterval);
    }

    /*
    * get all the task requests that this user can perform
    * */
    getMyTasks = (selective = false) => {
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid) {
            if(!selective) this.setState({fetching: true})
            getMyTasks(uid).then(myTasks => {
                if(!selective) this.setState({myTasks, fetching: false})
                else
                {
                    var toAdd = [];
                    myTasks.map(myTask => 
                    {
                        var curId = myTask.id;
                        var already_present = false;
                        this.state.myTasks.map(stateTask =>
                        {
                            if(stateTask.id == curId) already_present = true;
                        });
                        if(!already_present) toAdd.push(myTask);
                    });
                    var toRemove = [];
                    this.state.myTasks.map(stateTask =>
                    {
                        var shouldRemove = true;
                        myTasks.map(myTask => 
                        {
                            if(stateTask.id == myTask.id) shouldRemove = false;
                        });
                        if(shouldRemove) toRemove.push(stateTask.id);
                    });

                    let loadedTasks = [...this.state.myTasks];
                    let filteredTasks = loadedTasks.filter(item => !_.includes(toRemove, item.id));
                    this.setState({myTasks:filteredTasks.concat(toAdd)});
                }
            })
        }
    }


    // Locally hide task by removing it from myTasks object in the state 
    hideTask = (id) =>
    {
        let allTasks = [...this.state.myTasks];
        let filteredTasks = allTasks.filter(item => item.id != id);
        this.setState({myTasks:filteredTasks})
    }

    // Reject a task
    rejectTask = (id) =>
    {
        this.hideTask(id);
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid) appendRejectedTask(uid, id); // Write into databse that user {uid} rejected task {id}.
    }

    acceptTask = (id) =>
    {
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid)
        {
            serverExists(id).then(exists => // Check if someone has already accepted the task {id}. 
            {
                this.hideTask(id);
                if(!exists) // If the task is still not accepted by anyone, assign it to user {uid}.
                {
                    addServer(uid, id).then(whatsapp =>
                    {
                        this.props.navigation.navigate('Chat', { whatsapp: whatsapp });
                    });
                }
            });
        }
    }
    
    /*
    * render an item of the list
    * */
    renderItem = ({item: {serviceId, id, when, details} = {}}) => {
        var detailsAvailable = true;
        if(details == "" || typeof details == "undefined") detailsAvailable = false
        return (
            <View key={id} style={styles.rowItem}>
                <Text>{serviceId}</Text>
                <Text>{when}</Text>
                {
                    detailsAvailable &&
                    (
                        <Text>{details}</Text>
                    )
                }
                <View style={styles.buttonsContainer}>
                    <Button title='ACCEPT'  onPress={() => { this.acceptTask(id) }} />
                    <Button title='REJECT' onPress={() => { this.rejectTask(id) }} />
                </View>
            </View>
        )
    }

    render() {
        const {fetching, myTasks} = this.state
        return (
            <View style={styles.mainContainer}>
                <FlatList
                    style={styles.listContainer}
                    contentContainerStyle={styles.contentContainer}
                    data={myTasks}
                    extraData={myTasks}
                    renderItem={this.renderItem}
                    keyExtractor={(item, index) => item.id}
                />
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={'black'} size={'large'}/>
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
    contentContainer: {
        width: '100%'
    }
})
