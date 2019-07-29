import React, {Component} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import Icon from 'react-native-vector-icons/FontAwesome';
import logo from '../img/logo.png'
import {adourStyle, BRAND_COLOR_ONE, BRAND_COLOR_THREE} from './style/AdourStyle';

const FIRST_SLIDE_DESCRIPTION = 'When you join Tagmate, you join a private and exclusive community made just for your university. All profiles here are verified.';
const SECOND_SLIDE_DESCRIPTION = 'Discover what\'s happening on campus right now. Never miss out on events anymore. Deciding what to attend is as easy as a Swipe. ';
const THIRD_SLIDE_DESCRIPTION = 'Gather people around your favourite topic, start a study group or throw a party';
//const THIRD_SLIDE_DESCRIPTION = 'Tagmate is an inclusive and positive space. If you face any inapproperiate behavior, you can report the person.';


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
                    <Icon
                      name="heart-o"
                      size={100}
                      color="white"
                    />
                  ),
            title: 'A Community Just For You',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: FIRST_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle,
          },
          {
            backgroundColor: BRAND_COLOR_THREE,
            image: (
                    <Icon
                      name="street-view"
                      size={120}
                      color="white"
                    />
                  ),
            title: 'Be An Attendee',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: SECOND_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle
          },
          {
            backgroundColor: BRAND_COLOR_ONE,
            image: (
                    <Icon
                      name="bullhorn"
                      size={120}
                      color="white"
                    />
                  ),
            title: 'Be A Host',
            titleStyles: adourStyle.onboardingTitle,
            subtitle: THIRD_SLIDE_DESCRIPTION,
            subTitleStyles: adourStyle.onboardingSubtitle
          },

        ]}
      />
    )
  }

}

export {OnboardingSplash};
