import React, {Component} from 'react';
import {Card, ListItem, Button, CheckBox} from 'react-native-elements';
import {View, ActivityIndicator, StyleSheet, Text, TextInput, Picker, Dimensions, ScrollView} from 'react-native';
import firebase from 'react-native-firebase'
import {fetchAllServices} from "../actions";
import {postServiceRequest, getNetworkId, canRequestMore, getServiceItem, getFullName} from "../lib/firebaseUtils";
import {connect} from "react-redux";
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from "react-native-modal-datetime-picker";
import {adourStyle, BRAND_COLOR_TWO, BRAND_COLOR_FOUR} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window');

const CUSTOM_IMG = "http://instajude.com/assets/item_img/custom.jpg";

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
            customTitle: '',
            serviceTitle: '',
            bgImage:'http://instajude.com/assets/item_img/custom.jpg',
            selectedServiceId: 'custom',
            selectedServiceItem: [],
            dtPlaceholder: 'Date & Time (Optional)',
            isDateTimePickerVisible: false,
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
            const {when, details, anonymous, selectedServiceId, selectedServiceItem, serviceTitle, bgImage, customTitle} = this.state;
            let postTitle = '';
            //if(when == 'Time & Date') return this.erred('Please select time & date');
            //if(when.length > 20) return this.erred('When should not exceed 20 characters.');
            if(details.length > 142) return this.erred('Details should not exceed 142 characters.');
            if(customTitle.length > 24) return this.erred('Title should not exceed 24 characters. Use description to specify more details.');
            //Check if title is not blank if custom
            //Set postTitle to customTitle if its a custom post else set postTitle to serviceTitle
            if(selectedServiceId === 'custom'){
              if(customTitle == '')
                {
                  this.erred('You must put a post title');
                  this.setState({disabledBtn:false});
                  return
                }else{
                  postTitle = customTitle;
                }
            } else {
              //Its not a custom post
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
              getThumbURL(uid).then(thumbRes=> {
                //If its an anonymous post then use a dummy thumbnail instead of the user's thumbnail
                let thumbnail = '';
                if(anonymous){
                  thumbnail = "https://firebasestorage.googleapis.com/v0/b/chillmate-241a3.appspot.com/o/general%2Favatar.jpg?alt=media&token=4dcdfa81-fea1-4106-9306-26d67f55d62c";
                }else{
                  thumbnail = thumbRes;
                }
                getNetworkId(uid).then(networkId => {
                  createNewPost({when:when,details:details, anonymous: anonymous, customTitle: postTitle, fullName: fullName, networkId: networkId, bgImage: bgImage, hostThumb: thumbnail})
                  .then(({ data }) => {
                    console.log('[Client] Server successfully posted')
                    alert('Posted Successfully. You can find it on your Dashboard.')
                    this.setState({disabledBtn:false}); // Enable the button again
                    this.props.navigation.goBack();
                  })
                  .catch(HttpsError => {
                      console.log(HttpsError.code); // invalid-argument
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
        return alert(msg);
    }

  render(){
    const { isDateTimePickerVisible, when, dtPlaceholder, selectedServiceItem, selectedServiceId, customTitle, bgImage, selfName, customService } = this.state;
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
              });
            }}
            style={pickerSelectStyles}
            value={this.state.selectedServiceId}
          />
          </View>

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

              <Button title={dtPlaceholder} buttonStyle={styles.dateTimeStyle} titleStyle={styles.buttonTextStyle} disabled={this.state.disabledBtn} onPress={() => {this._showDateTimePicker()}}/>
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
	            <Button title="Post" buttonStyle={adourStyle.btnGeneral} titleStyle={adourStyle.btnText} disabled={this.state.disabledBtn} onPress={() => {this.sendRequest()}}/>
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
