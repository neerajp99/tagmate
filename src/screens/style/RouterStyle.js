import {StyleSheet} from 'react-native';

// COLOR 1: #4a8fe7
// USED IN Router.js


//TODO: Separate Router related style to another file so that Hot Reloading starts working

const routerStyle = StyleSheet.create({
  headerText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 24
  },
  bottomTabLabelStyle: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200'
  }

})

export default routerStyle;