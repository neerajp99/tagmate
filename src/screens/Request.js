import React, {Component} from 'react';
import {Card, ListItem} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet} from 'react-native'
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {postServiceRequest} from "../lib/firebaseUtils";

const list = [
    {
        title: 'Get something from Delhi',
        icon: 'av-timer'
    },
    {
        title: 'Bum a cig',
        icon: 'flight-takeoff'
    }];

class RequestScreen extends Component {
    componentWillMount() {
        const {fetchAllServices} = this.props
        setTimeout(fetchAllServices, 1000)
    }

    onItemPress = (item) => {
        console.log('item', item)
        if(!item.id) {
            return
        }
        postServiceRequest(item.id).then(res => {
            console.log('response of postService', res)
        })
    }

    render() {
        const {services = [], fetching} = this.props
        return (
            <View style={styles.mainContainer}>
                <Card title='Request'>
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

    }
})
