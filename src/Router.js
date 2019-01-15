import React from 'react';
import { Icon } from 'react-native-elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { createBottomTabNavigator, createSwitchNavigator, createAppContainer, createStackNavigator} from 'react-navigation';
import {ProfileScreen, EditProfileDetails, RequestScreen, RequestDetails, TaskScreen, DashboardScreen, DashboardDetails, Loading, Onboarding} from './screens';
import Login from './screens/auth/Login';
import SignUp from './screens/auth/SignUp';

export const ProfileStack = createStackNavigator(
  {
    ProfileScreen: {
      screen: ProfileScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Profile',
          headerStyle: {fontFamily: 'OpenSans-Regular'}
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
          headerTitle: 'More information'
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
    DashboardScreen: {
      screen: DashboardScreen,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Dashboard'
        }
      }
    },
    DashboardDetails: {
      screen: DashboardDetails,
      navigationOptions: ({navigation}) => {
        return{
          headerTitle: 'Task Details'
        }
      }
    }
  }
)

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
    Onboarding,
    MainStack
  },
  {
    initialRouteName: 'Loading'
  }
)

export const AppContainer = createAppContainer(RootNav);
