import React, {Component} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';
import logo from '../img/logo.png'
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_THREE} from './style/AdourStyle';

const FIRST_SLIDE_DESCRIPTION = 'Do you go to Delhi often? Can you help people with maths homework? Do you have some extra rolling papers? Offer help to those in need and collect Adour coins.';
const SECOND_SLIDE_DESCRIPTION = 'Need help with homework? Want something from Delhi? Need a rolling paper? Spend Adour coins and request a task. Adour matches you with the perfect person willing to do your task.';
const THIRD_SLIDE_DESCRIPTION = 'Build your Adour reputation by doing more for the community than asking from it. Get rewarded by earning silver, bronze and gold stars.';


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
                    <Image source={logo} style={{height: 47, width: 150}} />
                  ),
            title: 'Hi',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: 'Here is a quick tour of what Adour can do! You can skip this by pressing the button on the bottom left corner.',
            subTitleStyles: adourStyle.onboardingSubtitle
          },
          {
            backgroundColor: BRAND_COLOR_THREE,
            image: (
                    <Icon
                      name="heart-o"
                      size={120}
                      color="white"
                    />
                  ),
            title: 'Give',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: FIRST_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle
          },
          {
            backgroundColor: BRAND_COLOR_ONE,
            image: (
                    <Icon
                      name="handshake-o"
                      size={100}
                      color="white"
                    />
                  ),
            title: 'Get',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: SECOND_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle,
          },
          {
            backgroundColor: BRAND_COLOR_THREE,
            image: (
                    <Icon
                      name="star-o"
                      size={100}
                      color="white"
                    />
                  ),
            title: 'Earn',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: THIRD_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle,
          },

        ]}
      />
    )
  }

}

export {OnboardingSplash};
