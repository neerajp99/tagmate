import React from 'react';
import { Icon } from 'react-native-elements';
import { createBottomTabNavigator, createSwitchNavigator, createAppContainer, createStackNavigator} from 'react-navigation';
import {ProfileScreen, EditProfileDetails, RequestScreen, RequestDetails, TaskScreen, DashboardScreen, Loading} from './screens';
import Login from './screens/auth/Login';
import SignUp from './screens/auth/SignUp';

export const ProfileStack = createStackNavigator(
  {
    ProfileScreen: {
      screen: ProfileScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Profile'
        }
      }
    },
    EditProfileDetails: {
      screen: EditProfileDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Edit Details'
        }
      }
    }
  }
)

export const RequestStack = createStackNavigator(
  {
    RequestScreen: {
      screen: RequestScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Request'
        }
      }
    },
    RequestDetails: {
      screen: RequestDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Edit Details'
        }
      }
    }
  }
)

export const TaskStack = createStackNavigator(
  {
    TaskScreen: {
      screen: TaskScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Tasks'
        }
      }
    }
  }
)

export const DashboardStack = createStackNavigator(
  {
    TaskScreen: {
      screen: DashboardScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Dashboard'
        }
      }
    }
  }
)

export const MainTabNav = createBottomTabNavigator(
  {
    Profile: ProfileStack,
    Request: RequestStack,
    Tasks: TaskStack,
    Dashboard: DashboardStack
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
      activeTintColor: 'tomato',
      inactiveTintColor: 'gray',
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
    MainStack
  },
  {
    initialRouteName: 'Loading'
  }
)

export const AppContainer = createAppContainer(RootNav);
