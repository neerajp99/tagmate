import firebase from 'react-native-firebase';
import {LOGIN_USER, LOGIN_USER_SUCCESS, LOGIN_USER_FAIL} from './types';

export const loginUser = ({email, password}) => {
  return (dispatch) => {
    dispatch({type:LOGIN_USER});
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(user => loginUserSuccess(dispatch, user))
      .catch( () => loginUserFail(dispatch));
  };
};

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
  dispatch({
    type: LOGIN_USER_SUCCESS,
    payload: user
  });
};

const loginUserFail = (dispatch) => {
  dispatch({type: LOGIN_USER_FAIL});
};
