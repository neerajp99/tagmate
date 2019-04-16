import React, {Component} from 'react';
import {Card, ListItem, Button, CheckBox} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput, Picker, Dimensions, ScrollView} from 'react-native';
import firebase from 'react-native-firebase'
import {fetchAllServices} from "../actions";
import {postServiceRequest,canRequestMore, getServiceItem, getFullName, createCustomService} from "../lib/firebaseUtils";
import {connect} from "react-redux";
import DateTimePicker from "react-native-modal-datetime-picker";
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window');

const CUSTOM_IMG = "http://chillmateapp.com/assets/item_img/custom.jpg";

class RequestDetails extends Component{
  	constructor(props) {
        super(props);
        this.state = {
            disabledBtn:false, // Check if service request button is disabeld or not. Default: not disabled.
            when:'', //Added DEFAULT VALUE to ASAP. Originally, it was empty string
            details:'',
            anonymous: false,
            selfName:'',
            customTitle: '',
            selectedServiceId: 'custom',
            selectedServiceItem: [],
            dtPlaceholder: 'Date & Time (Optional)',
            isDateTimePickerVisible: false,
        }
    }

    componentWillMount() {
        const {fetchAllServices} = this.props
        setTimeout(fetchAllServices, 1000)
    }

    componentDidMount() {
      const {currentUser: {uid} = {}} = firebase.auth();
      // Get name of the user
      getFullName(uid).then(selfName=>
      {
        this.setState({selfName:selfName});
      });
    }

    _showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });

   _hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });

   _handleDatePicked = date => {
     this.setState({ when: this.formatDate(date), dtPlaceholder: this.formatDate(date) });
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

   postAsAnonymous = () => {
     if(this.state.selectedServiceId === "custom"){
       alert("You cannot be Anonymous if you are creating a custom activity")
     } else {
       this.setState({anonymous: !this.state.anonymous})
     }
   }

  	sendRequest = () =>
    {
        if(this.state.disabledBtn == true) return;
        else
        {
            this.setState({disabledBtn:true}); // Disable button while function is running.
            const {currentUser: {uid} = {}} = firebase.auth();
            const {when, details, anonymous, selectedServiceId, selectedServiceItem, customTitle} = this.state;
            //if(when == 'Time & Date') return this.erred('Please select time & date');
            //if(when.length > 20) return this.erred('When should not exceed 20 characters.');
            if(details.length > 60) return this.erred('Details should not exceed 60 characters.');
            if(selectedServiceId === 'custom' && customTitle == ''){
              this.erred('You must put a post title');
              this.setState({disabledBtn:false});
              return
            }

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

          if(selectedServiceId === 'custom'){
            createCustomService(customTitle).then(newServiceId => {
              postServiceRequest({serviceId:newServiceId, when:when,details:details, anonymous: anonymous}).then(res => {
              this.setState({disabledBtn:false}); // Enable the button again
              this.props.navigation.navigate('Tasks');
              });
            })
          } else {
            postServiceRequest({serviceId:selectedServiceId, when:when,details:details, anonymous: anonymous}).then(res => {
            this.setState({disabledBtn:false}); // Enable the button again
            this.props.navigation.navigate('Tasks'); 
            });
          }

        }
    }

    // This function changes the button's state from disabled to enabled
    // and returns an alert box with the message that was sent as parameter.
    erred = (msg) => {
        this.setState({disabledBtn:false});
        return alert(msg);
    }

  render(){
    const { isDateTimePickerVisible, when, dtPlaceholder, selectedServiceItem, selectedServiceId, selfName, customService } = this.state;
    const {services = [], fetching} = this.props;


    //Get the service item of the selected service ID so that we can update the title and image in realtime
    if(selectedServiceId != "custom")
    {
      getServiceItem(selectedServiceId).then(serviceItem => {
      this.setState({selectedServiceItem: serviceItem})
      })
    } else {
      //the user has selected custom service, populate title and image with custom service ones
      selectedServiceItem.img = CUSTOM_IMG;
      selectedServiceItem.title = this.state.customTitle;
    }

    var today = new Date();
    date=today.getDate() + "/"+ parseInt(today.getMonth()+1) +"/"+ today.getFullYear();

    return(
      <ScrollView>
      	<View style={styles.backgroundContainer}>
	        <Card featuredTitle={selectedServiceItem.title} featuredTitleStyle={adourStyle.listItemText} image={{uri: selectedServiceItem.img}} >
          <ListItem
            title={this.state.anonymous? "Anonymous": selfName}
            titleStyle={adourStyle.listItemText}
            subtitle="Host"
            subtitleStyle={adourStyle.listItemText}
            hideChevron={true}
            containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
          />

          <View style={styles.cardSubtitle}>

          </View>
          <Picker
            selectedValue={selectedServiceId}
            style={adourStyle.pickerStyle}
            onValueChange={(itemValue, itemIndex) =>
              this.setState({selectedServiceId: itemValue})
            }>
            {
                services.map((item, i) => (
                    <Picker.Item label={item.description} key={i} value={item.id} />
                ))
            }
            <Picker.Item label="Custom" value={"custom"} />
          </Picker>

          { selectedServiceId === "custom" &&
            <TextInput
            style={adourStyle.textInputCenter}
            autoCapitalize="none"
            placeholder="Post Title"
            placeholderStyle={adourStyle.placeholderStyle}
            placeholderTextColor={'rgba(255, 255, 255, 1)'}
            underlineColorAndroid='transparent'
            onChangeText={customTitle => this.setState({ customTitle: customTitle })}
            />}

              <TextInput
                style={adourStyle.textInputCenter}
                autoCapitalize="none"
                placeholder="Additional Details"
                placeholderStyle={adourStyle.placeholderStyle}
                placeholderTextColor={'rgba(255, 255, 255, 1)'}
                underlineColorAndroid='transparent'
                onChangeText={details => this.setState({ details: details })}
              />

              <Button title={dtPlaceholder} buttonStyle={styles.dateTimeStyle} textStyle={styles.buttonTextStyle} disabled={this.state.disabledBtn} onPress={() => {this._showDateTimePicker()}}/>
              <DateTimePicker
                isVisible={isDateTimePickerVisible}
                mode='datetime'
                date={today}
                minimumDate={today}
                is24Hour={false}
                onConfirm={this._handleDatePicked}
                onCancel={this._hideDateTimePicker}
              />

              <CheckBox
                title='Post As Anonymous'
                checked={this.state.anonymous}
                onPress={() => this.postAsAnonymous()}
              />
	            <Button title="Post" buttonStyle={adourStyle.btnGeneral} textStyle={adourStyle.btnText} disabled={this.state.disabledBtn} onPress={() => {this.sendRequest()}}/>
	        </Card>
	    </View>
      </ScrollView>
    )
  }
}
/*
<View>
    <Text>Provide additional details</Text>
</View>
*/
const mapStateToProps = ({profile: {fetching, services = []} = {}}, props) => {
    return {
        fetching, services
    }
}

export default connect(mapStateToProps, {fetchAllServices})(RequestDetails);

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
      height: 45,
      backgroundColor: 'rgba(54, 105, 169, 0.2)',
      justifyContent: 'center',
      marginBottom: 20,
    },
    buttonTextStyle: {
      fontFamily:'OpenSans-Semibold',
      fontSize: 16,
      fontWeight: '800',
      color: 'rgba(255, 255, 255, 1)'
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
