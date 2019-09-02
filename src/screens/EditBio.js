import React, {Component} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, TextInput, Linking, Image, ScrollView} from 'react-native';
import { ListItem, Card, Avatar } from 'react-native-elements';
import firebase from 'react-native-firebase';
import uuid from 'react-native-uuid'
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {setUserBio, updateAvatar, getBio, getNetworkId} from '../lib/firebaseUtils.js';
import {adourStyle, BRAND_COLOR_ONE} from './style/AdourStyle';

const { width: WIDTH } = Dimensions.get('window')
const PLACEHOLDER_AVATAR = "https://firebasestorage.googleapis.com/v0/b/chillmate-241a3.appspot.com/o/general%2Favatar.jpg?alt=media&token=4dcdfa81-fea1-4106-9306-26d67f55d62c";

const options = {
  title: 'Select Image',
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
};

class EditBio extends Component{
  uid = "";

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      coins: 'Loading...',
      bio: '_____ _____ _____ ___ ______',
      imgSource: '',
      pickedImage: '',
      networkId: '',
      photoURL: PLACEHOLDER_AVATAR,
      displayName: '_____ _____'
      };
  }

  componentDidMount(){
    this._isMounted = true;
    firebase.analytics().setCurrentScreen('EditBio');
    //Fetching name and photo URL
    let user = firebase.auth().currentUser;
    if (user != null) {
      this.uid = user.uid;
      displayName = user.displayName;
      getNetworkId(user.uid).then(networkId => {
        getBio(user.uid).then(bio => {
          this.setState({displayName, bio, networkId, loading: false});
        })
      })
    } else {
      this.props.navigation.navigate('Login')
    }

    this.firebaseListeners();
  }



  componentWillUnmount(){
    this._isMounted = false;
  }

  firebaseListeners = () =>
  {
    if(this._isMounted)
    {
      let user = firebase.auth().currentUser;
      if (user != null) {
        uid = user.uid;
        //Get profile picture
        firebase.database().ref(`/users/${uid}/profilePicture`).on("value", function(snapshot)
        {
          if(this._isMounted) this.setState({photoURL: snapshot.val() || PLACEHOLDER_AVATAR });
        }.bind(this));
        //Get Bio
        firebase.database().ref(`/users/${uid}/bio`).on("value", function(snapshot)
        {
          if(this._isMounted) this.setState({bio: snapshot.val() || ""});
        }.bind(this));

      }



    }
  }

  /**
 * Select image method
 */
  pickImage() {
    ImagePicker.openPicker({
      mediaType: 'photo',
      width: 500,
      height: 500,
      compressImageMaxWidth: 500,
      compressImageMaxHeight: 500,
      compressImageQuality: 0.5,
      cropping: true
    }).then(image => {
      this.setState({
        loading: true
      })
      //console.log('selected image.path: ', image.path)
      this.uploadImage(image);
    }).catch(e => {
      console.log(e);
      //alert(e.message ? e.message : e);
    });
  }


  uploadImage(image) {
    //console.log("FirebaseStorageService :: image.path ", image.path );
    const imageId = uuid.v4();

    var firebaseStorageRef = firebase.storage().ref(`${this.state.networkId}/imgs`);
    const imageRef = firebaseStorageRef.child(imageId + ".jpeg");

    //A thumbnail is created for any image created with thumb_NAME.jpeg. This is done on the cloud.
    const thumbRef = firebaseStorageRef.child("thumb_" + imageId + ".jpeg");

    //console.log("FirebaseStorageService :: imageRef ", imageRef);


    imageRef.putFile(image.path, {contentType: 'image/jpeg'}).then(function(){
        return imageRef.getDownloadURL();
    }).then(function(url){
        //console.log("Image url", url);
        thumbRef.getDownloadURL().then(thumbURL => {
          console.log("done");
          updateAvatar(uid, url, thumbURL)
        })
    }).catch(function(error){
        console.log("Error while saving the image.. ", error);
        //onError(error);
    });
  }

  onButtonPress() {
      setUserBio(this.uid, this.state.bio).then(res => {
        this.props.navigation.goBack()
      })
  }

  render(){
    return(
      <ScrollView>
      <View style={styles.backgroundContainer}>

            <Card title="Update Profile Picture" titleStyle={adourStyle.cardTitleSmall} containerStyle={{alignItems: 'center', justifyContent: 'center'}}>
              <View style={{alignItems: 'center', justifyContent: 'center', marginBottom: 8}} >
              <Avatar
                size="large"
                rounded
                showEditButton
                editButton={{onPress: this.pickImage.bind(this) }}
                source={{uri: this.state.photoURL}}
                onPress={this.pickImage.bind(this)}
                activeOpacity={0.7}
              />

              </View>
              <Text style={adourStyle.titleTextCenter}>{this.state.displayName}</Text>
            </Card>


        <Card title="Edit Bio" titleStyle={adourStyle.cardTitleSmall} containerStyle={{alignItems: 'center', justifyContent: 'center'}}>
        <View style={{alignItems: 'center', justifyContent: 'center', marginBottom: 8}} >
          <TextInput
            style={adourStyle.textInputLeftMultiline}
            autoCapitalize="none"
            placeholder="Please write about your background, hobbies and interests"
            multiline={true}
            maxLength = {500}
            autoCorrect={true}
            placeholderStyle={adourStyle.placeholderStyleMultiline}
            placeholderTextColor={'rgba(0, 0, 0, 0.65)'}
            underlineColorAndroid='transparent'
            value={this.state.bio}
            onChangeText={bio => this.setState({ bio: bio })}
          />
          </View>

          </Card>

          <Card>
            <TouchableOpacity style={adourStyle.btnGeneral} onPress={this.onButtonPress.bind(this)}>
              <Text style={adourStyle.btnText}>Save</Text>
            </TouchableOpacity>
        </Card>
        <View style={{marginTop: 25}} />
      </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 8,
    backgroundColor: '#eceff1'
  },
  btn: {
    width: WIDTH - 20,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'darkgrey',
    justifyContent: 'center',
    marginTop: 20
  },
  titleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'left'
  },
  subtitleText: {
    color: 'rgba(0, 0, 0, 0.8)',
    fontSize: 20,
    fontWeight: '200',
    textAlign: 'left'
  },
  btnText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    textAlign: 'center'
  },
  loading: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  alignItems: 'center',
  justifyContent: 'center'
  }
})


export {EditBio};
