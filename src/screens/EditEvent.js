import React, { Component } from "react";
import {
  Card,
  ListItem,
  Button,
  CheckBox,
  Icon as IconElements
} from "react-native-elements";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  Picker,
  Dimensions,
  Alert,
  Share,
  ScrollView
} from "react-native";
import firebase from "react-native-firebase";
import {
  postServiceRequest,
  getNetworkId,
  canRequestMore,
  getServiceItem,
  getThumbURL,
  isVerified,
  getFullName
} from "../lib/firebaseUtils";
import moment from "moment";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "react-native-modal-datetime-picker";
import {
  adourStyle,
  BRAND_COLOR_TWO,
  BRAND_COLOR_FOUR
} from "./style/AdourStyle";

const { width: WIDTH } = Dimensions.get("window");

const CUSTOM_IMG = "https://tagmateapp.com/assets/item_img/custom.jpg";

let uid;

class EditEvent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disabledBtn: false, // Check if service request button is disabeld or not. Default: not disabled.
      when: this.props.navigation.state.params.item.when,
      details: this.props.navigation.state.params.item.details,
      id: this.props.navigation.state.params.item.id,
      anonymous: false,
      selfName: "",
      publicPost: true,
      customTitle: this.props.navigation.state.params.item.customTitle,
      venue: this.props.navigation.state.params.item.venue,
      dtStart: this.props.navigation.state.params.item.dtStart,
      dtEnd: this.props.navigation.state.params.item.dtEnd,
      hostName: this.props.navigation.state.params.item.hostName,
      link: "",
      serviceTitle: "",
      loading: false,
      bgImage: this.props.navigation.state.params.item.bgImage,
      selectedServiceId: "custom",
      selectedServiceItem: [],
      dtStartPlaceholder: "Start Date & Time",
      dtEndPlaceholder: "End Date & Time",
      isDateTimeStartPickerVisible: false,
      isDateTimeEndPickerVisible: false
    };

    this.inputRefs = {
      firstTextInput: null,
      selectedServiceId: null,
      selectedServiceId1: null,
      lastTextInput: null
    };
  }

  parseIcsDate = icsDate => {
    if (!/^[0-9]{8}T[0-9]{6}Z$/.test(icsDate))
      throw new Error("ICS Date is wrongly formatted: " + icsDate);

    var year = icsDate.substr(0, 4);
    var month = icsDate.substr(4, 2);
    var day = icsDate.substr(6, 2);

    var hour = icsDate.substr(9, 2);
    var minute = icsDate.substr(11, 2);
    var second = icsDate.substr(13, 2);

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    // return new Date(Date.UTC(`${year}, ${month} , day, hour, minute, second`));
  };

  // method to set state
  onChangeText = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  componentDidMount() {
    this._isMounted = true;
    {
      if (this.state.dtEnd.length > 0) {
        endWhen = this.formatDate(this.parseIcsDate(this.state.dtEnd));
        this.setState({
          dtEndPlaceholder: endWhen
        });
      }
    }
    this.setState({
      dtStartPlaceholder: this.state.when
    });

    let user = firebase.auth().currentUser;
    if (user != null) {
      uid = user.uid;
    }

    firebase.analytics().setCurrentScreen("EditEvent");

    // Get name of the user
    getFullName(uid).then(selfName => {
      if (this._isMounted) this.setState({ selfName: selfName });
      console.log("selfName ", this.state.selfName);
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _showStartDateTimePicker = () =>
    this.setState({ isDateTimeStartPickerVisible: true });

  _showEndDateTimePicker = () =>
    this.setState({ isDateTimeEndPickerVisible: true });

  _hideStartDateTimePicker = () =>
    this.setState({ isDateTimeStartPickerVisible: false });

  _hideEndDateTimePicker = () =>
    this.setState({ isDateTimeEndPickerVisible: false });

  _handleStartDatePicked = date => {
    const dateISO = moment(date)
      .startOf("minute")
      .toISOString();
    let newDateA = dateISO.replace(/[-:]/g, "");
    let newDateB = newDateA.split(".")[0] + "Z";
    this.setState({
      when: this.formatDate(date),
      dtStartPlaceholder: this.formatDate(date),
      dtStart: newDateB
    });
    console.log("dtStart is ", newDateB);
    console.log("when: ", this.state.when);
    this._hideStartDateTimePicker();
  };

  _handleEndDatePicked = date => {
    const dateISO = moment(date)
      .startOf("minute")
      .toISOString();
    let newDateA = dateISO.replace(/[-:]/g, "");
    let newDateB = newDateA.split(".")[0] + "Z";
    this.setState({ dtEndPlaceholder: this.formatDate(date), dtEnd: newDateB });
    console.log("dtEnd is ", newDateB);
    this._hideEndDateTimePicker();
  };

  formatDate = d => {
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let weekday = weekdays[d.getDay()];
    let month = months[d.getMonth()];
    let minutes = d.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    let formattedDate =
      weekday +
      ", " +
      month +
      " " +
      d.getDate() +
      " at " +
      d.getHours() +
      ":" +
      minutes;
    console.log(formattedDate);
    return formattedDate;
  };

  onShare = postTitle => {
    Share.share(
      {
        message: `Check out this gathering on campus: ${postTitle}. I think you\'ll be interested in it. https://tagmateapp.com`,
        url: "https://tagmateapp.com",
        title: `${postTitle}`
      },
      {
        // Android only:
        dialogTitle: "Share this gathering"
      }
    );
  };

  publicInfo() {
    Alert.alert(
      "What are public events?",
      "Public events: Anyone can join your event immediately. \nNon-public events: guests have to wait for your approval to join.",
      [{ text: "Got It" }]
    );
  }

  // This function changes the button's state from disabled to enabled
  // and returns an alert box with the message that was sent as parameter.
  erred = msg => {
    this.setState({ disabledBtn: false });
    return Alert.alert("😵 Yikes!", msg, [{ text: "Got it" }]);
  };

  updateRequest = () => {
    getNetworkId(uid)
      .then(networkId => {
        let ref = firebase
          .database()
          .ref(`networks/${networkId}/allPosts/${this.state.id}`);
        ref.update({
          details: this.state.details,
          venue: this.state.venue,
          dtStart: this.state.dtStart,
          dtEnd: this.state.dtEnd,
          when: this.state.when
        });
      })
      .then(() => {
        this.props.navigation.goBack();
      });
  };

  render() {
    const {
      isDateTimeStartPickerVisible,
      isDateTimeEndPickerVisible,
      when,
      dtStartPlaceholder,
      dtEndPlaceholder,
      selfName,
      link
    } = this.state;
    const {
      customTitle,
      bgImage,
      venue,
      details,
      dtStart,
      dtEnd,
      hostName
    } = this.state;

    var today = new Date();
    date =
      today.getDate() +
      "/" +
      parseInt(today.getMonth() + 1) +
      "/" +
      today.getFullYear();

    return (
      <ScrollView>
        <View style={styles.backgroundContainer}>
          <Card
            featuredTitle={customTitle}
            featuredTitleStyle={adourStyle.listItemText}
            image={{ bgImage }}
          >
            <ListItem
              title={hostName}
              titleStyle={adourStyle.listItemText}
              subtitle="Host"
              subtitleStyle={adourStyle.listItemText}
              chevron={false}
              containerStyle={{
                borderBottomColor: "transparent",
                borderBottomWidth: 0
              }}
            />

            <View style={styles.cardSubtitle} />

            {/*
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

            <Text style={adourStyle.defaultText}>Event Description</Text>
            <TextInput
              style={adourStyle.textInputLeftMultiline}
              autoCapitalize="none"
              name="details"
              placeholder={details}
              multiline={true}
              autoCorrect={true}
              placeholderStyle={adourStyle.placeholderStyleMultiline}
              placeholderTextColor={"rgba(0, 0, 0, 0.65)"}
              underlineColorAndroid="transparent"
              value={this.state.details}
              onChangeText={details => this.setState({ details: details })}
            />
            <Text style={adourStyle.defaultText}>Venue</Text>
            <TextInput
              style={adourStyle.textInputLeft}
              name="venue"
              autoCapitalize="none"
              placeholder={venue}
              placeholderStyle={adourStyle.placeholderStyle}
              placeholderTextColor={"rgba(0, 0, 0, 0.65)"}
              underlineColorAndroid="transparent"
              value={this.state.venue}
              onChangeText={venue => this.setState({ venue: venue })}
            />
            <Text style={adourStyle.defaultText}>Start Time</Text>
            <Button
              title={dtStartPlaceholder}
              buttonStyle={styles.dateTimeStyleLeft}
              titleStyle={styles.buttonTextStyle}
              disabled={this.state.disabledBtn}
              onPress={() => {
                this._showStartDateTimePicker();
              }}
            />
            <DateTimePicker
              isVisible={isDateTimeStartPickerVisible}
              mode="datetime"
              date={today}
              minimumDate={today}
              is24Hour={false}
              onConfirm={this._handleStartDatePicked}
              onCancel={this._hideStartDateTimePicker}
            />
            <Text style={adourStyle.defaultText}>End Time</Text>
            <Button
              title={dtEndPlaceholder}
              buttonStyle={styles.dateTimeStyleLeft}
              titleStyle={styles.buttonTextStyle}
              disabled={this.state.disabledBtn}
              onPress={() => {
                this._showEndDateTimePicker();
              }}
            />
            <DateTimePicker
              isVisible={isDateTimeEndPickerVisible}
              mode="datetime"
              date={today}
              minimumDate={today}
              is24Hour={false}
              onConfirm={this._handleEndDatePicked}
              onCancel={this._hideEndDateTimePicker}
            />

            <Button
              title="Update"
              buttonStyle={adourStyle.btnGeneral}
              titleStyle={adourStyle.btnText}
              disabled={this.state.disabledBtn}
              loading={this.state.disabledBtn}
              onPress={() => {
                this.updateRequest();
              }}
            />
          </Card>
        </View>
      </ScrollView>
    );
  }
}
/*
<View>
    <Text>Provide additional details</Text>
</View>
*/
// const mapStateToProps = ({profile: {fetching, services = []} = {}}, props) => {
//     return {
//         fetching, services
//     }
// }

export default EditEvent;

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8
  },
  mainContainer: {
    flex: 1
  },
  dateTimeStyle: {
    height: 45,
    width: WIDTH - 110,
    backgroundColor: "rgba(54, 105, 169, 0.2)",
    justifyContent: "center",
    marginBottom: 20,
    marginLeft: 15
  },
  dateTimeStyleLeft: {
    height: 45,
    width: WIDTH - 110,
    backgroundColor: "rgba(54, 105, 169, 0.2)",
    justifyContent: "flex-start",
    marginBottom: 20,
    marginLeft: 15
  },
  buttonTextStyle: {
    fontFamily: "OpenSans",
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 15,
    color: "rgba(0, 0, 0, 0.65)"
  },
  progressContainer: {
    left: "50%",
    top: "50%",
    width: 100,
    height: 100,
    backgroundColor: "transparent",
    marginLeft: -50,
    marginTop: -50
  },
  requestTitle: {
    fontWeight: "bold"
  },
  cardSubtitle: {
    marginBottom: 16,
    marginLeft: 18
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 4,
    color: "black",
    paddingRight: 30 // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "grey",
    borderRadius: 8,
    color: "black",
    paddingRight: 30 // to ensure the text is never behind the icon
  }
});
