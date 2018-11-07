import React, {Component} from 'react';
import {FlatList, View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {getMyTasks} from "../lib/firebaseUtils";
import firebase from 'react-native-firebase'
import { Button } from 'react-native-elements'

class TaskScreen extends Component {
    state = {
        myTasks: [],
        fetching: false
    }
    componentWillMount(){
        this.getMyTasks()
    }

    /*
    * get all the task requests that this user can perform
    * */
    getMyTasks = () => {
        const {currentUser: {uid} = {}} = firebase.auth()
        if(uid) {
            this.setState({fetching: true})
            getMyTasks(uid).then(myTasks => {
                this.setState({myTasks, fetching: false})
            })
        }
    }

    /*
    * render an item of the list
    * */
    renderItem = ({item: {serviceId, id} = {}}) => {
        return (
            <View key={id} style={styles.rowItem}>
                <Text>{serviceId}</Text>
                <View style={styles.buttonsContainer}>
                    <Button
                        title='ACCEPT' />

                    <Button
                        title='REJECT' />
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
