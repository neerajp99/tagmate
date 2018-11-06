import firebase from 'react-native-firebase';
import {SUBMIT_SERVICES} from './types';

{/* Function parameters should be scalable, not hardcoded like this. */}

export const submitUserServices = ({delhi, cig, rollingpaper, laundry}) => {
  const { currentUser } = firebase.auth();

  return () => {
    console.log(currentUser.uid);

    firebase.database().ref(`/users/${currentUser.uid}/services`)
      .set({delhi, cig, rollingpaper, laundry})
      .then(() => {
        console.log('firebase submitted');
        this.props.navigation.navigate('MainStack');
      });
  };

}
