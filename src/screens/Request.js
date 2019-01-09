import React, {Component} from 'react';
import {Card, ListItem, Button} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput} from 'react-native'
import firebase from 'react-native-firebase'
import {connect} from "react-redux";
import {fetchAllServices} from "../actions";
import {postServiceRequest} from "../lib/firebaseUtils";

class RequestScreen extends Component {
    state = {requesting:false}

    componentWillMount() {
        const {fetchAllServices} = this.props
        setTimeout(fetchAllServices, 1000)
    }

    onItemPress = (item) => {
        console.log('item', item)
        if(!item.id) {
            return
        }
        this.setState({requesting:true,request:item,when:'', details:''});
    }

    goBack = () =>
    {
        this.setState({requesting:false});
    }

    sendRequest = () =>
    {
        const {when, details, request} = this.state;
        if(when.length == 0) return alert('Please input when.');
        if(when.length > 20) return alert('When should not exceed 20 characters.');
        if(details.length > 60) return alert('Details should not exceed 60 characters.');
        postServiceRequest({serviceId:request.id,when:when,details:details}).then(res => {
            console.log('response of postService', res)
            this.setState({requesting:false});
        })
    }

    render() {
        const {services = [], fetching} = this.props
        const {requesting} = this.state
        return (
            <View style={styles.mainContainer}>
                {
                    !requesting && <Card>
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
                }
                {
                    requesting &&
                    (
                        <View>
                            <Button title="Back" onPress={() => {this.goBack()}}/>
                            <Card title='Request Service'>
                                <Text style={styles.requestTitle}>{this.state.request.title}</Text>
                                <Text>When?</Text>
                                <TextInput
                                placeholder="Required"
                                style={styles.textInput}
                                onChangeText={when => this.setState({ when: when })} />
                                <Text>Details?</Text>
                                <TextInput
                                placeholder="Optional"
                                style={styles.textInput}
                                onChangeText={details => this.setState({ details: details })} />
                                <Button title="Request" onPress={() => {this.sendRequest()}}/>
                            </Card>
                        </View>
                    )
                }
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
