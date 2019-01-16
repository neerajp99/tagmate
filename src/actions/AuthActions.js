import firebase from 'react-native-firebase';
import {LOGIN_USER, LOGIN_USER_SUCCESS, LOGIN_USER_FAIL, SIGNUP_USER_SUCCESS} from './types';
import {creditCoins} from '../lib/firebaseUtils.js';

export const loginUser = ({email, password}) => {
  return (dispatch) => {
    dispatch({type:LOGIN_USER});
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(user => loginUserSuccess(dispatch, user))
      .catch( () => loginUserFail(dispatch));
  };
};

export const addNewGoogleUser =  (uid,fname,lname,picture) => {  
  try {
    const usersRef = firebase.database().ref('users/'+uid)
    usersRef.once('value', (snapshot) => {
        const usersObj = snapshot.val()
        if(usersObj == null){
          firebase.database().ref('users/'+uid).set({
            firstName: fname,
            lastName: lname,
            profilePicture: picture,
            coins: 3,
          });
        }
        //loginUserSuccess(dispatch({type:LOGIN_USER}));
    })
  } catch (error) {
      console.log(error);
  }
}

export const signupUser = ({email, password}) => {
  return (dispatch) => {
    dispatch({type:LOGIN_USER});
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(user => signupUserSuccess(dispatch, user))
      .catch( (err) => {
        alert(err.message)})
  };
};

const loginUserSuccess = (dispatch, user) => {
  dispatch({
    type: LOGIN_USER_SUCCESS,
    payload: user
  });
  this.props.navigation.navigate('MainStack');
};

const signupUserSuccess = (dispatch, user) => {
  const {currentUser: {uid} = {}} = firebase.auth();
  creditCoins(uid).then(result =>
  {
    dispatch({
      type: SIGNUP_USER_SUCCESS,
      payload: user
    });
  });
};

const loginUserFail = (dispatch) => {
  dispatch({type: LOGIN_USER_FAIL});
};
