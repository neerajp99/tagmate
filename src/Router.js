import React from 'react';
import { Icon } from 'react-native-elements';
import { createBottomTabNavigator, createSwitchNavigator, createAppContainer} from 'react-navigation';
import {ProfileScreen, RequestScreen, TaskScreen, DashboardScreen, Details, Loading} from './screens';
import Login from './screens/auth/Login';
import SignUp from './screens/auth/SignUp';

export const MainStack = createBottomTabNavigator(
  {
    Profile: ProfileScreen,
    Request: RequestScreen,
    Tasks: TaskScreen,
    Dashboard: DashboardScreen
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === 'Profile') {
          iconName = `account-circle`;
        } else if (routeName === 'Request') {
          iconName = `dashboard`;
        } else if (routeName === 'Tasks'){
          iconName = 'view-list';
        } else if (routeName === 'Dashboard'){
          iconName = 'computer';
        }

        // You can return any component that you like here! We usually use an
        // icon component from react-native-vector-icons
        return <Icon name={iconName} size={horizontal ? 20 : 25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: 'tomato',
      inactiveTintColor: 'gray',
    },
  }
);


export const RootNav = createSwitchNavigator(
  {
    Loading,
    SignUp,
    Login,
    Details,
    MainStack
  },
  {
    initialRouteName: 'Loading'
  }
)

export const AppContainer = createAppContainer(RootNav);
