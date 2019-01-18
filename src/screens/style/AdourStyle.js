import {StyleSheet} from 'react-native';

// COLOR 1: #4a8fe7
// USED IN Router.js


//TODO: Separate Router related style to another file so that Hot Reloading starts working

export const BRAND_COLOR_ONE = '#5C7AFF';
export const BRAND_COLOR_TWO = '#4A8FE7';
export const BRAND_COLOR_THREE = '#845BFF';
export const BRAND_COLOR_FOUR = '#215596';

export const adourStyle = StyleSheet.create({
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
  buttonText: {
    fontFamily:'OpenSans-Regular'
  },
  logoSubtitle: {
    color: 'white',
    fontFamily:'OpenSans-Semibold',
    fontSize: 16,
    fontWeight: '200',
    marginTop: 10,
    opacity: 0.8
  },
  onboardingSubtitle: {
    fontFamily:'OpenSans-Semibold',
    color: 'white',
    fontSize: 14,
    fontWeight: '200'
  },
  onboardingTitle: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 35
  }

})
