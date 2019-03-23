import React, {Component} from 'react';
import {Card, ListItem, Button} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput, Picker, Dimensions} from 'react-native';
import firebase from 'react-native-firebase'
import {postServiceRequest,canRequestMore} from "../lib/firebaseUtils";
import DateTimePicker from "react-native-modal-datetime-picker";
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window');

class RequestDetails extends Component{
  	constructor(props) {
        super(props);
        this.state = {
            disabledBtn:false, // Check if service request button is disabeld or not. Default: not disabled.
            when:'Time & Date', //Added DEFAULT VALUE to ASAP. Originally, it was empty string
            details:'',
            isDateTimePickerVisible: false,
        }
    }

    _showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });

   _hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

   _handleDatePicked = date => {
     this.setState({ when: this.formatDate(date) });
     this._hideDateTimePicker();
   };

   formatDate = (d) => {
     var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
     let weekday = weekdays[d.getDay()];
     let month = months[d.getMonth()];
     let minutes = d.getMinutes();
     if (minutes < 10)  minutes = '0'+minutes;
     let formattedDate = weekday+', '+ month+ ' ' + d.getDate() + ' at ' + d.getHours() + ':' + minutes;
     console.log(formattedDate)
     return formattedDate
   }

  	sendRequest = () =>
    {
        if(this.state.disabledBtn == true) return;
        else
        {
            this.setState({disabledBtn:true}); // Disable button while function is running.
            const {currentUser: {uid} = {}} = firebase.auth();
            const {when, details} = this.state;
            if(when == 'Time & Date') return this.erred('Please select time & date');
            //if(when.length > 20) return this.erred('When should not exceed 20 characters.');
            if(details.length > 60) return this.erred('Details should not exceed 60 characters.');

            /* PREVENTS USER FROM CREATING POSTS IF USER DOES NOT HAVE ENOUGH COINS - DISABLED TEMPORARILY
              canRequestMore(uid).then(requestMore => {  // If the user can post more service requests:
                if(requestMore) postServiceRequest({serviceId:this.props.navigation.state.params.item.id,when:when,details:details}).then(res => {
                this.setState({disabledBtn:false}); // Enable the button again
                this.props.navigation.navigate('RequestScreen'); // Redirect user to RequestScreen
            });
                else
                {
                    return this.erred('Sorry, you do not have enough reputation coins. Contact customer support for help.');
                    // user has as many ongoing requests as their Adour coin balance.
                }
            });
          */

          //If you enable the currently disabled coin system again, delete below code
          postServiceRequest({serviceId:this.props.navigation.state.params.item.id,when:when,details:details}).then(res => {
          this.setState({disabledBtn:false}); // Enable the button again
          this.props.navigation.navigate('RequestScreen'); // Redirect user to RequestScreen
          });

        }
    }

    // This function changes the button's state from disabled to enabled
    // and returns an alert box with the message that was sent as parameter.
    erred = (msg) => {
        this.setState({disabledBtn:false});
        return alert(msg);
    }

  render(){
    const { isDateTimePickerVisible, when } = this.state;
  	const { title } = this.props.navigation.state.params.item;
    var today = new Date();
    date=today.getDate() + "/"+ parseInt(today.getMonth()+1) +"/"+ today.getFullYear();

    return(
      	<View style={styles.backgroundContainer}>
	        <Card title={title} titleStyle={adourStyle.cardTitle} >
          <View style={styles.cardSubtitle}>
          <Text style={adourStyle.cardSubtitle}>Specify a time & date when you're available for the chosen activity. </Text>
          </View>
              <Button title={when} buttonStyle={styles.dateTimeStyle} textStyle={adourStyle.placeholderStyle} disabled={this.state.disabledBtn} onPress={() => {this._showDateTimePicker()}}/>
              <DateTimePicker
                isVisible={isDateTimePickerVisible}
                mode='datetime'
                date={today}
                minimumDate={today}
                is24Hour={false}
                onConfirm={this._handleDatePicked}
                onCancel={this._hideDateTimePicker}
              />

              <TextInput
                style={adourStyle.textInput}
                autoCapitalize="none"
                placeholder="Conversation Topic (Optional)"
                placeholderStyle={adourStyle.placeholderStyle}
                placeholderTextColor={'rgba(255, 255, 255, 0.9)'}
                underlineColorAndroid='transparent'
                onChangeText={details => this.setState({ details: details })}
              />
	            <Button title="Post" buttonStyle={adourStyle.btnGeneral} textStyle={adourStyle.btnText} disabled={this.state.disabledBtn} onPress={() => {this.sendRequest()}}/>
	        </Card>
	    </View>
    )
  }
}
/*
<View>
    <Text>Provide additional details</Text>
</View>
*/
export {RequestDetails};

const styles = StyleSheet.create({
		backgroundContainer: {
		flex: 1,
		paddingLeft: 15,
		paddingRight: 8
	},
    mainContainer: {
        flex: 1,
    },
    dateTimeStyle: {
      borderRadius: 25,
      height: 45,
      backgroundColor: 'rgba(54, 105, 169, 0.2)',
      justifyContent: 'center',
      marginBottom: 20,
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
    cardSubtitle: {
      marginBottom: 16,
      marginLeft: 18
    },
})
