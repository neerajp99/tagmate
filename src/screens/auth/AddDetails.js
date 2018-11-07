// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import {StyleSheet, Text, TextInput, View, Button} from 'react-native';
import {CheckBox} from 'react-native-elements';
import {connect} from 'react-redux';
import {submitUserServices} from '../../actions';
import * as _ from 'lodash'

class AddDetails extends Component {
    state = {
        myServices: []
    }

    onButtonPress() {
        const {myServices} = this.state;
        this.props.submitUserServices(myServices);
    }

    renderServices = () => {
        const {services} = this.props
        const {myServices} = this.state
        return services.map(service => (
                <CheckBox
                    key={service.id}
                    title={service.description}
                    checked={_.includes(myServices, service.id)}
                    onPress={() => this.onItemPressed(service.id)}
                />
            )
        )
    }
    onItemPressed = (id) => {
        const {myServices} = this.state
        let newServices = []
        if(_.includes(myServices, id)) {
            newServices = myServices.filter(item => item === id)
        } else {
           newServices = [...myServices, id]
        }
        console.log(myServices, newServices)
        this.setState({myServices: newServices})
    }

    render() {
        const {services} = this.props
        console.log('services', services)
        return (
            <View>
                <Text>What can you offer?</Text>
                {/* TODO: Turn CheckBox into a resusable component. Use a loop to iterate and render. */}
                {this.renderServices()}
                <Button title="Done" onPress={this.onButtonPress.bind(this)}/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    textInput: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 8
    }
})

const mapStateToProps = ({auth: {loading, error} = {}, profile: {fetching, services = []} = {}}) => {
    /* only return the property that we care about */
    return {
        error, loading, fetching, services
    };
};

export default connect(mapStateToProps, {submitUserServices})(AddDetails);
