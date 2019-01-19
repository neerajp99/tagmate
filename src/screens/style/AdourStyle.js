import {StyleSheet, Dimensions} from 'react-native';
// COLOR 1: #4a8fe7
// USED IN Router.js


//TODO: Separate Router related style to another file so that Hot Reloading starts working

//Light Blue
export const BRAND_COLOR_ONE = '#5C7AFF';
export const BRAND_COLOR_TWO = '#4A8FE7';

//Light Purple
export const BRAND_COLOR_THREE = '#845BFF';
//Dark Blue
export const BRAND_COLOR_FOUR = '#215596';

//Cyan
export const BRAND_COLOR_FIVE = '#73FBD3'

const { width: WIDTH } = Dimensions.get('window');

export const adourStyle = StyleSheet.create({
  listItemText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200'
  },
  defaultText: {
    fontFamily:'OpenSans-Regular',
    marginLeft: 12,
    marginBottom: 10,
    marginTop: 10,
    fontWeight:'200'
  },
  titleText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 28
  },
  guideText: {
    fontFamily:'OpenSans-Semibold',
    fontWeight:'200',
    fontSize: 22,
    color: '#999999',
    marginBottom: 10
  },
  headerText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize: 24
  },
  buttonText: {
    fontFamily:'OpenSans-Regular'
  },
  buttonTextBold: {
    fontFamily:'OpenSans-Semibold',
  },
  logoSubtitle: {
    color: 'white',
    fontFamily:'OpenSans-Semibold',
    fontSize: 16,
    fontWeight: '200',
    marginTop: 10,
    opacity: 0.8
  },
  placeholderStyle: {
    fontFamily:'OpenSans-Semibold',
    fontSize: 16,
    fontWeight: '200',
    color: 'rgba(0, 0, 0, 0.35)'
  },
  textInput: {
    height: 45,
    width: WIDTH -120,
    borderRadius: 25,
    marginLeft: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily:'OpenSans-Semibold',
    paddingLeft: 25,
    backgroundColor: 'rgba(54, 105, 169, 0.2)',
    color: 'rgba(0, 0, 0, 0.35)'
  },
  picker: {
    fontFamily:'OpenSans-Semibold',
    paddingLeft: 25,
    backgroundColor: 'rgba(54, 105, 169, 0.5)',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  pickerContainer: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BRAND_COLOR_ONE,
    overflow: 'hidden'
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
  },
  cardTitle: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    fontSize:20,
    marginLeft: 18,
    textAlign:'left',
  },
  cardSubtitle: {
    fontFamily:'OpenSans-Regular',
    fontSize: 16,
    fontWeight: '100'
  },
  btnGeneral: {
    borderRadius: 25,
    height: 45,
    backgroundColor: BRAND_COLOR_TWO,
    justifyContent: 'center',
    marginTop: 20
  },
  btnCancel: {
    borderRadius: 25,
    height: 45,
    backgroundColor: '#85A2C5',
    justifyContent: 'center',
    marginTop: 20
  },
  btnText: {
    fontFamily:'OpenSans-Regular',
    fontWeight:'200',
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    textAlign: 'center'
  }

})
