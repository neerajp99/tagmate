import {StyleSheet} from 'react-native';

// COLOR 1: #4a8fe7
// USED IN Router.js


//TODO: Separate Router related style to another file so that Hot Reloading starts working

const adourStyle = StyleSheet.create({
  listItemText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200'
  },
  titleText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 28
  },
  headerText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 24
  },
  bottomTabLabelStyle: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200'
  },
  buttonText: {
    fontFamily:'OpenSans-Regular'
  },
  logoSubtitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '200',
    marginTop: 10,
    opacity: 0.8
  }

})

export default adourStyle;
