import React, {Component} from 'react';
import {Card, ListItem, Button, CheckBox, Icon as IconElements} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput, Picker, Dimensions, Alert, Share, ScrollView} from 'react-native';
import firebase from 'react-native-firebase'
import {fetchAllServices} from "../actions";
import {postServiceRequest, getNetworkId, canRequestMore, getServiceItem, getThumbURL, isVerified, getFullName} from "../lib/firebaseUtils";
import {connect} from "react-redux";
import moment from 'moment'
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from "react-native-modal-datetime-picker";
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window');

const CUSTOM_IMG = "https://tagmateapp.com/assets/item_img/custom.jpg";

let uid;

class CreatePost extends Component{
  	constructor(props) {
        super(props);
        this.state = {
            disabledBtn:false, // Check if service request button is disabeld or not. Default: not disabled.
            when:'', //Added DEFAULT VALUE to ASAP. Originally, it was empty string
            details:'',
            anonymous: false,
            selfName:'',
            publicPost: true,
            customTitle: '',
            venue: '',
            dtStart: '',
            dtEnd: '',
            serviceTitle: '',
            loading: false,
            bgImage:'https://tagmateapp.com/assets/item_img/custom.jpg',
            selectedServiceId: 'custom',
            selectedServiceItem: [],
            dtStartPlaceholder: 'Start Date & Time',
            dtEndPlaceholder: 'End Date & Time',
            isDateTimeStartPickerVisible: false,
            isDateTimeEndPickerVisible: false,
        }

        this.inputRefs = {
          firstTextInput: null,
          selectedServiceId: null,
          selectedServiceId1: null,
          lastTextInput: null,
        };
    }

    componentWillMount() {
        const {fetchAllServices} = this.props
        setTimeout(fetchAllServices, 1000)
    }

    componentDidMount() {
      this._isMounted = true;
      let user = firebase.auth().currentUser;
      if (user != null) {
        uid = user.uid;
      }

      firebase.analytics().setCurrentScreen('CreatePost');

      // Get name of the user
      getFullName(uid).then(selfName=>
      {
        if(this._isMounted) this.setState({selfName:selfName});
        console.log('selfName ', this.state.selfName)
      });

    }

    componentWillUnmount()
    {
        this._isMounted = false;
    }

    _showStartDateTimePicker = () => this.setState({ isDateTimeStartPickerVisible: true });

    _showEndDateTimePicker = () => this.setState({ isDateTimeEndPickerVisible: true });

   _hideStartDateTimePicker = () => this.setState({ isDateTimeStartPickerVisible: false });

   _hideEndDateTimePicker = () => this.setState({ isDateTimeEndPickerVisible: false });

   _handleStartDatePicked = date => {
     const dateISO = moment(date).startOf("minute").toISOString();
     let newDateA = dateISO.replace(/[-:]/g, "");
     let newDateB = newDateA.split('.')[0]+"Z";
     this.setState({ when: this.formatDate(date), dtStartPlaceholder: this.formatDate(date), dtStart: newDateB});
     console.log('dtStart is ', newDateB);
     this._hideStartDateTimePicker();
   };

   _handleEndDatePicked = date => {
     const dateISO = moment(date).startOf("minute").toISOString();
     let newDateA = dateISO.replace(/[-:]/g, "");
     let newDateB = newDateA.split('.')[0]+"Z";
     this.setState({ dtEndPlaceholder: this.formatDate(date), dtEnd: newDateB});
     console.log('dtEnd is ', newDateB);
     this._hideEndDateTimePicker();
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

   onShare = (postTitle) => {
   Share.share({
     message: `Check out this gathering on campus: ${postTitle}. I think you\'ll be interested in it. https://tagmateapp.com`,
     url: 'https://tagmateapp.com',
     title: `${postTitle}`
    }, {
     // Android only:
     dialogTitle: 'Share this gathering',
    })
  }

  publicInfo(){
    Alert.alert(
        'What are public events?',
        'Public events: Anyone can join your event immediately. \nNon-public events: guests have to wait for your approval to join.',
        [
          {text: 'Got It'}
        ]
      );
  }

  	sendRequest = () =>
    {
        if(this.state.disabledBtn == true) return;
        else
        {
            this.setState({disabledBtn:true}); // Disable button while function is running.
            const {when, publicPost, dtStart, venue, details, anonymous, selectedServiceId, selectedServiceItem, serviceTitle, bgImage, customTitle} = this.state;
            let postTitle = '';
            //if(when == 'Time & Date') return this.erred('Please select time & date');
            //if(when.length > 20) return this.erred('When should not exceed 20 characters.');
            if(details.length > 1500) return this.erred('Details should not exceed 1500 characters.');
            if(customTitle.length > 24) return this.erred('Title should not exceed 24 characters. Use description to specify more details.');
            //Check if title is not blank if custom
            //Set postTitle to customTitle if its a custom post else set postTitle to serviceTitle
            if(selectedServiceId === 'custom'){
              if(customTitle == '')
                {
                  this.erred('You forgot to write the title of your post');
                  this.setState({disabledBtn:false});
                  return
                }else{
                  postTitle = customTitle;
                }
            } else {
              //Its not a custom post
                if(selectedServiceId === null){
                  this.erred('Please select an item from the dropdown menu. Use custom if not sure.');
                  return
                }
                if(details == ''){
                  this.erred(`You forgot to specify details about your ${this.state.selectedServiceItem.title}`);
                  return
                }
                postTitle = serviceTitle;
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

          //If you enable the currently disabled coin system again, delete below code

          if(selectedServiceId === 'custom'){
            createCustomService(customTitle).then(newServiceId => {
              postServiceRequest({serviceId:selectedServiceId, when:when,details:details, anonymous: anonymous, custom: custom, customTitle: customTitle}).then(res => {
              this.setState({disabledBtn:false}); // Enable the button again
              this.props.navigation.navigate('Home');
              });
            })
          }
          */

          /* DISABLING LOCAL POST FUNCTION
            postServiceRequest({serviceId:selectedServiceId, when:when,details:details, anonymous: anonymous, customTitle: customTitle}).then(res => {
            this.setState({disabledBtn:false}); // Enable the button again
            this.props.navigation.goBack();
            });
            */

            /* // TESTER
            getFullName(uid).then(fullName=>
            {
              getNetworkId(uid).then(networkId => {
                console.log(`when: ${when}, details: ${details}, anonymous: ${anonymous}, customTitle: ${postTitle}, fullName: ${fullName}, networkId: ${networkId}, bgImage: ${bgImage}`);
              })
            })
            */


            //ENABLING CLOUD BASED POST FUNCTION
            const createNewPost = firebase.functions().httpsCallable('createNewPost');

            getFullName(uid).then(fullName=>
            {
              isVerified(uid).then(verified => {
                getThumbURL(uid).then(thumbRes=> {
                  //If its an anonymous post then use a dummy thumbnail instead of the user's thumbnail
                  let thumbnail = '';
                  if(anonymous){
                    thumbnail = "https://firebasestorage.googleapis.com/v0/b/chillmate-241a3.appspot.com/o/general%2Favatar.jpg?alt=media&token=4dcdfa81-fea1-4106-9306-26d67f55d62c";
                  }else{
                    thumbnail = thumbRes;
                  }
                  getNetworkId(uid).then(networkId => {
                    createNewPost({when:when, dtStart: dtStart, venue: venue, details:details, publicPost: publicPost, anonymous: anonymous, verified: verified, customTitle: postTitle, fullName: fullName, networkId: networkId, bgImage: bgImage, hostThumb: thumbnail})
                    .then(({ data }) => {
                      console.log('[Client] Server successfully posted')
                      Alert.alert(
                          'Yay! 😄',
                          'Posted Successfully. You can find it on your Dashboard.',
                          [
                            {text: 'Cool'},
                            {text: 'Share', onPress: () => this.onShare(postTitle)},
                          ]
                        );
                      this.setState({disabledBtn:false}); // Enable the button again
                      this.props.navigation.goBack();
                    })
                    .catch(HttpsError => {
                        console.log(HttpsError.code); // invalid-argument
                    })
                  })
                })
              })
            });

        }
    }

    // This function changes the button's state from disabled to enabled
    // and returns an alert box with the message that was sent as parameter.
    erred = (msg) => {
        this.setState({disabledBtn:false});
        return Alert.alert(
        '😵 Yikes!',
        msg,
        [
          {text: 'Got it'},
        ]
      );
    }

  render(){
    const { isDateTimeStartPickerVisible, isDateTimeEndPickerVisible, when, dtStartPlaceholder, dtEndPlaceholder, selectedServiceItem, selectedServiceId, customTitle, bgImage, selfName, customService } = this.state;
    const {services = [], fetching} = this.props;

    let servicesArray = [];
    services.map((item, i) => {
        servicesArray.push({
          label: item.description,
          value: item.id,
          key: i
        })
    })

    servicesArray.push({
      label: 'Custom',
      value: 'custom',
      key: 'custom'
    })

    //Get the service item of the selected service ID so that we can update the title and image in realtime

    if(selectedServiceId != "custom")
    {
      getServiceItem(selectedServiceId).then(serviceItem => {
      if(this._isMounted) this.setState({selectedServiceItem: serviceItem, bgImage: serviceItem.img, serviceTitle: serviceItem.title})
      selectedServiceItem.title = serviceItem.title;
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
            chevron={false}
            containerStyle={{borderBottomColor: 'transparent', borderBottomWidth: 0}}
          />

          <View style={styles.cardSubtitle}>

          </View>

          { /*
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
        */}

        <View style={{marginLeft: 15, marginBottom: 8, marginRight: 15}} >
          <RNPickerSelect
            selectedValue={selectedServiceId}
            items={servicesArray}
            useNativeAndroidPickerStyle={false}
            onValueChange={value => {
              this.setState({
                selectedServiceId: value,
                anonymous: false
              });
            }}
            style={pickerSelectStyles}
            value={this.state.selectedServiceId}
          />
          </View>

          { selectedServiceId === "custom" &&
            <TextInput
            style={adourStyle.textInputLeft}
            autoCapitalize="none"
            placeholder="Title"
            placeholderStyle={adourStyle.placeholderStyle}
            placeholderTextColor={'rgba(0, 0, 0, 0.65)'}
            underlineColorAndroid='transparent'
            onChangeText={customTitle => this.setState({ customTitle: customTitle })}
            />}

              <TextInput
                style={adourStyle.textInputLeftMultiline}
                autoCapitalize="none"
                placeholder="Details"
                multiline={true}
                autoCorrect={true}
                placeholderStyle={adourStyle.placeholderStyleMultiline}
                placeholderTextColor={'rgba(0, 0, 0, 0.65)'}
                underlineColorAndroid='transparent'
                onChangeText={details => this.setState({ details: details })}
              />

              <TextInput
              style={adourStyle.textInputLeft}
              autoCapitalize="none"
              placeholder="Venue"
              placeholderStyle={adourStyle.placeholderStyle}
              placeholderTextColor={'rgba(0, 0, 0, 0.65)'}
              underlineColorAndroid='transparent'
              onChangeText={venue => this.setState({ venue: venue })}
              />

              <Button title={dtStartPlaceholder} buttonStyle={styles.dateTimeStyleLeft} titleStyle={styles.buttonTextStyle} disabled={this.state.disabledBtn} onPress={() => {this._showStartDateTimePicker()}}/>
              <DateTimePicker
                isVisible={isDateTimeStartPickerVisible}
                mode='datetime'
                date={today}
                minimumDate={today}
                is24Hour={false}
                onConfirm={this._handleStartDatePicked}
                onCancel={this._hideStartDateTimePicker}
              />

              <Button title={dtEndPlaceholder} buttonStyle={styles.dateTimeStyleLeft} titleStyle={styles.buttonTextStyle} disabled={this.state.disabledBtn} onPress={() => {this._showEndDateTimePicker()}}/>
              <DateTimePicker
                isVisible={isDateTimeEndPickerVisible}
                mode='datetime'
                date={today}
                minimumDate={today}
                is24Hour={false}
                onConfirm={this._handleEndDatePicked}
                onCancel={this._hideEndDateTimePicker}
              />

              <CheckBox
                title='Public'
                checked={this.state.publicPost}
                onPress={() => this.setState({ publicPost: !this.state.publicPost})}
              />

              <Text onPress={this.publicInfo} style={adourStyle.defaultTextSmall}>What are public events?</Text>
              {/* DISABLED TEMPORARILY
              <CheckBox
                title='Post As Anonymous'
                checked={this.state.anonymous}
                onPress={() => this.postAsAnonymous()}
              />
              */}
	            <Button title="Post" buttonStyle={adourStyle.btnGeneral} titleStyle={adourStyle.btnText} disabled={this.state.disabledBtn} loading={this.state.disabledBtn} onPress={() => {this.sendRequest()}}/>
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

export default connect(mapStateToProps, {fetchAllServices})(CreatePost);

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
      width: WIDTH - 110,
      backgroundColor: 'rgba(54, 105, 169, 0.2)',
      justifyContent: 'center',
      marginBottom: 20,
      marginLeft: 15
    },
    dateTimeStyleLeft: {
      height: 45,
      width: WIDTH - 110,
      backgroundColor: 'rgba(54, 105, 169, 0.2)',
      justifyContent: 'flex-start',
      marginBottom: 20,
      marginLeft: 15
    },
    buttonTextStyle: {
      fontFamily:'OpenSans',
      fontSize: 14,
      fontWeight: '400',
      marginLeft: 15,
      color: 'rgba(0, 0, 0, 0.65)'
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

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'grey',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
