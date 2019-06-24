import React, {Component} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';
import logo from '../img/logo.png'
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_THREE} from './style/AdourStyle';

const FIRST_SLIDE_DESCRIPTION = 'All profiles are verified profiles from your specific university.';
const SECOND_SLIDE_DESCRIPTION = 'Go on a walk, get chai, or smoke a cig with someone new. Want to play foosball, tennis or chess at a particular time? Find someone to play with you!';
//const THIRD_SLIDE_DESCRIPTION = 'Instajude is an inclusive and positive space. If you face any inapproperiate behavior, you can report the person.';


class OnboardingSplash extends Component {

render() {
    return(
        <Onboarding
        onSkip={() => this.props.navigation.navigate('Login')}
        onDone={() => this.props.navigation.navigate('Login')}
        pages={[
          {
            backgroundColor: BRAND_COLOR_ONE,
            image: (
                    <Image source={logo} style={{height: 61, width: 250}} />
                  ),
            title: 'Hi',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: 'Instajude is your tool to meet new people over activities you enjoy.',
            subTitleStyles: adourStyle.onboardingSubtitle
          },
          {
            backgroundColor: BRAND_COLOR_ONE,
            image: (
                    <Icon
                      name="thumbs-o-up"
                      size={100}
                      color="white"
                    />
                  ),
            title: 'Zero Fake Profiles',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: FIRST_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle,
          },
          {
            backgroundColor: BRAND_COLOR_THREE,
            image: (
                    <Icon
                      name="smile-o"
                      size={120}
                      color="white"
                    />
                  ),
            title: 'Make your life an epic adventure!',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: SECOND_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle
          },

        ]}
      />
    )
  }

}

export {OnboardingSplash};
