import React, {Component} from 'react';
import {Card, ListItem, Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {View, ActivityIndicator, StyleSheet, Text, TextInput} from 'react-native'
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {canRequestMore} from '../lib/firebaseUtils.js';

class RequestScreen extends Component {
    componentWillMount() {
        const {fetchAllServices} = this.props
        setTimeout(fetchAllServices, 1000)
    }

    onItemPress = (item) => {
        if(!item.id) return;
        const {currentUser: {uid} = {}} = firebase.auth();
        canRequestMore(uid).then(requestMore => {
            if(requestMore) this.props.navigation.navigate('RequestDetails', {item:item});
            else return alert('Sorry, you have as many ongoing requests as your Adour coin balance.');
        });
    }

    render() {
        const {services = [], fetching} = this.props
        return (
            <View style={styles.mainContainer}>
                <Card>
                    {
                        services.map((item, i) => (
                            <ListItem
                                key={i}
                                title={item.title}
                                leftIcon={{name: item.icon}}
                                onPress={() => this.onItemPress(item)}
                            />
                        ))
                    }
                </Card>
                {
                    fetching && <View style={styles.progressContainer}>
                        <ActivityIndicator color={'black'} size={'large'}/>
                    </View>
                }

                <Card>
                    <ListItem
                        title='Add a custom service'
                        leftIcon='add-circle-outline'
                        containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
                        onPress={() => this.addCustomService()}
                    />
                </Card>
            </View>
        )
    }
}

const mapStateToProps = ({profile: {fetching, services = []} = {}}, props) => {
    return {
        fetching, services
    }
}

export default connect(mapStateToProps, {fetchAllServices})(RequestScreen);


const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    progressContainer: {
        left: '50%',
        top: '50%',
        width: 100,
        height: 100,
        backgroundColor: 'transparent',
        marginLeft: -50,
        marginTop: -50

    },
    requestTitle: {
        fontWeight: 'bold',
    },
    textInput: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 8,
    },
})
