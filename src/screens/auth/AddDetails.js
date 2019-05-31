// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import {StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView} from 'react-native';
import {CheckBox, Card, Divider, ButtonGroup} from 'react-native-elements';
import {connect} from 'react-redux';
import {submitUserUpdates} from '../../actions';
import {getMyServices} from '../../lib/firebaseUtils';
import * as _ from 'lodash'
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_ONE} from '../style/AdourStyle'

class AddDetails extends Component {
    state = {myServices: []};

    async componentDidMount()
    {
        // Loading services already offered:
        var myServicess = await getMyServices(this.props.userId);
        this.setState({myServices: myServicess});
    }

    onButtonPress() {
        const {myServices} = this.state;

        // Validating user inputs:
        if(_.isEmpty(myServices))
        {
            alert('You must select atleast one activity you are interested in');
            return;
        } else {
            this.props.submitUserUpdates(myServices); // Finalling updating profile.
            if(typeof this.props.onboarding != "undefined") this.props.onboarding.navigate('MainStack');
            if(typeof this.props.onboarding == "undefined") alert('Changes Saved');
        }
    }

    renderServices = () => {
        const {services} = this.props
        const {myServices} = this.state
        return services.map(service => (
                <CheckBox
                    key={service.id}
                    title={service.description}
                    textStyle={adourStyle.listItemText}
                    checkedIcon='check'
                    checkedColor={BRAND_COLOR_ONE}
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
            // If item was already checked, uncheck it.
            newServices = myServices.filter(item => item !== id)
        } else {
            // If item was unchecked, check it.
            newServices = [...myServices, id]
        }
        console.log(myServices, newServices)
        // Update state to reflect changes:
        this.setState({myServices: newServices})
    }

    render() {
        const {services} = this.props

        return (
            <ScrollView>
            <Card>
                {/* TODO: Turn CheckBox into a resusable component. Use a loop to iterate and render. */}
                <Text style={adourStyle.defaultText}>What are you interested in?</Text>
                {this.renderServices()}
            </Card>
            <Card>
                <TouchableOpacity style={adourStyle.btnGeneral} onPress={this.onButtonPress.bind(this)}>
                  <Text style={adourStyle.btnText}>Save Preferences</Text>
                </TouchableOpacity>
            </Card>
            </ScrollView>
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
    },
    btn: {
      height: 45,
      borderRadius: 25,
      backgroundColor: 'darkgrey',
      justifyContent: 'center',
      marginTop: 20
    }
})

const mapStateToProps = ({auth: {loading, error} = {}, profile: {fetching, services = []} = {}}) => {
    /* only return the property that we care about */
    return {
        error, loading, fetching, services
    };
};

export default connect(mapStateToProps, {submitUserUpdates})(AddDetails);
