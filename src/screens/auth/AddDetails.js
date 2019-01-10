// SignUp.js
import React, {Component} from 'react';
import firebase from 'react-native-firebase';
import {StyleSheet, Text, TextInput, View, TouchableOpacity} from 'react-native';
import {CheckBox} from 'react-native-elements';
import {connect} from 'react-redux';
import {submitUserUpdates} from '../../actions';
import {getMyServices, getWhatsapp} from '../../lib/firebaseUtils';
import * as _ from 'lodash'

class AddDetails extends Component {
    state = {myServices: [],};

    async componentDidMount()
    {
        // Loading services already offered:
        var myServicess = await getMyServices(this.props.userId);
        this.setState({myServices: myServicess,});
        // Loading Whatsapp number:
        var myWhatsapp = await getWhatsapp(this.props.userId);
        this.setState({mobile: myWhatsapp || ''});
    }

    onButtonPress() {
        const {myServices, mobile} = this.state;
        
        // Validating user inputs:
        if(_.isEmpty(myServices))
        {
            alert('You have to offer at least one service.');
            return;
        }
        else if(!(/^\d{10}$/.test(mobile)))
        {
            alert('Please fill in a valid mobile number.');
            return;
        }
        else this.props.submitUserUpdates(myServices, mobile); // Finalling updating profile.
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

    renderWhatsapp = () => {
        return (
                <TextInput
                  style={styles.textInput}
                  autoCapitalize="none"
                  onChangeText={mobile => this.setState({ mobile: mobile })}
                  value={this.state.mobile}
                />
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
            <View>
                {/* TODO: Turn CheckBox into a resusable component. Use a loop to iterate and render. */}
                <Text>What's your Whatsapp number?</Text>
                {this.renderWhatsapp()}
                {this.renderServices()}
                <TouchableOpacity style={styles.btn} onPress={this.onButtonPress.bind(this)}>
                  <Text style={styles.btnText}>Save Preferences</Text>
                </TouchableOpacity>
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
    },
    btn: {
      height: 45,
      borderRadius: 25,
      backgroundColor: 'darkgrey',
      justifyContent: 'center',
      marginTop: 20
    },
    btnText: {
      color: 'rgba(255, 255, 255, 1)',
      fontSize: 16,
      textAlign: 'center'
    }
})

const mapStateToProps = ({auth: {loading, error} = {}, profile: {fetching, services = []} = {}}) => {
    /* only return the property that we care about */
    return {
        error, loading, fetching, services
    };
};

export default connect(mapStateToProps, {submitUserUpdates})(AddDetails);
