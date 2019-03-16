import React, {Component} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';
import logo from '../img/logo.png'
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_THREE} from './style/AdourStyle';

const FIRST_SLIDE_DESCRIPTION = 'What you create out of that conversation is up to you. A great conversation can lead to a date, a friend, a career opportunity or it can just be a conversation.';
const SECOND_SLIDE_DESCRIPTION = 'All profiles are verified Ashoka profiles. Your identity is only revealed to your Chillmate and no one else.';
const THIRD_SLIDE_DESCRIPTION = 'Chillmate is an inclusive and positive space. If you face any inapproperiate behavior, you can report the person.';


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
            subtitle: 'Chillmate is about creating amazing conversations, one connection at a time.',
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
            title: 'A Great Conversation',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: FIRST_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle
          },
          {
            backgroundColor: BRAND_COLOR_ONE,
            image: (
                    <Icon
                      name="star-o"
                      size={100}
                      color="white"
                    />
                  ),
            title: 'Zero Fake Profiles',
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
            title: 'Safe',
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
