import firebase from 'react-native-firebase';

{/* TECH DEBT: Function parameters should be scalable, not hardcoded like this. */}
{/* New database should be like this but with a loop */}

export const submitUserServices = ({delhi, cig, rollingpaper, laundry}) => {
  const { currentUser } = firebase.auth();

  return (dispatch) => {
    if(delhi){
      firebase.database().ref(`/services/delhi`)
      .push(currentUser.uid)
      .then(() => {
        dispatch({ type: EMPLOYEE_CREATE });
        Actions.employeeList({ type: 'reset' });
      });
    }
    if(cig){
      console.log(delhi);
    }
    if(rollingpaper){
      console.log(delhi);
    }
    if(laundry){
      console.log(laundry);
    }
  };

}
