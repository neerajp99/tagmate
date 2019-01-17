import React from 'react';
import { Icon } from 'react-native-elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator, createSwitchNavigator, createAppContainer, createStackNavigator} from 'react-navigation';
import {ProfileScreen, EditProfileDetails, RequestScreen, RequestDetails, TaskScreen, DashboardScreen, DashboardDetails, Loading, Onboarding, OnboardingSplash} from './screens';
import Login from './screens/auth/Login';
import SignUp from './screens/auth/SignUp';
import adourStyle from './screens/style/AdourStyle';


// Stack Navigator for Profile and Edit Profile screens:
export const ProfileStack = createStackNavigator(
  {
    ProfileScreen: {
      screen: ProfileScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Profile',
          headerTitleStyle: adourStyle.headerText
        }
      }
    },
    EditProfileDetails: {
      screen: EditProfileDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Edit Details',
          headerTitleStyle: adourStyle.headerText
        }
      }
    }
  }
)

// Stack Navigator for Request and Request Details screens:
export const RequestStack = createStackNavigator(
  {
    RequestScreen: {
      screen: RequestScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Request',
          headerTitleStyle: adourStyle.headerText
        }
      }
    },
    RequestDetails: {
      screen: RequestDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Additional Info',
          headerTitleStyle: adourStyle.headerText
        }
      }
    }
  }
)

// Stack Navigator for Tasks screen:
export const TaskStack = createStackNavigator(
  {
    TaskScreen: {
      screen: TaskScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Tasks',
          headerTitleStyle: adourStyle.headerText
        }
      }
    }
  }
)

// Stack Navigator for Dashboard and Dashboard Details screens:
export const DashboardStack = createStackNavigator(
  {
    DashboardScreen: {
      screen: DashboardScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Dashboard',
          headerTitleStyle: adourStyle.headerText
        }
      }
    },
    DashboardDetails: {
      screen: DashboardDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Task Details',
          headerTitleStyle: adourStyle.headerText
        }
      }
    }
  }
)

// Bottom Tab Navigator connecting all the above navigators as siblings:
export const MainTabNav = createBottomTabNavigator(
  {
    Profile: {
      screen: ProfileStack,
      navigationOptions: {
        tabBarIcon: ({  focused, horizontal, tintColor  }) => (
          <Icon name='account-circle' size={horizontal ? 20 : 25} color={tintColor} />
        ),
      },
    },
    Request: {
      screen: RequestStack,
      navigationOptions: {
        tabBarIcon: ({  focused, horizontal, tintColor  }) => (
          <Icon name='dashboard' size={horizontal ? 20 : 25} color={tintColor} />
        ),
      },
    },
    Tasks: {
      screen: TaskStack,
      navigationOptions: {
        tabBarIcon: ({  focused, horizontal, tintColor  }) => (
          <Icon name='view-list' size={horizontal ? 20 : 25} color={tintColor} />
        ),
      },
    },
    Dashboard: {
      screen: DashboardStack,
      navigationOptions: {
        tabBarIcon: ({  focused, horizontal, tintColor  }) => (
          <Icon name='chat-bubble' size={horizontal ? 20 : 25} color={tintColor} />
        ),
      },
    }
  },
  {
    navigationOptions: ({ navigation }) => {
      const {routeName} = navigation.state.routes[navigation.state.index]
      return {
        header: null,
        headerTitle: routeName
        }

    },
    tabBarOptions: {
      activeTintColor: '#4a8fe7',
      inactiveTintColor: 'gray',
      labelStyle: adourStyle.bottomTabLabelStyle
    },
  }
);

export const MainStack = createStackNavigator(
  {
    MainTabNav: MainTabNav
  }
)
export const RootNav = createSwitchNavigator(
  {
    Loading,
    SignUp,
    Login,
    Onboarding,
    OnboardingSplash,
    MainStack,
  },
  {
    initialRouteName: 'Loading'
  }
)

export const AppContainer = createAppContainer(RootNav);
