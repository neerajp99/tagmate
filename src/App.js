import React, {Component} from 'react';
import {View, Text} from 'react-native';
import firebase from 'react-native-firebase';
import ReduxThunk from 'redux-thunk';
import reducers from './reducers';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import {RootNav} from './Router';
import AddDetails from './screens/auth/AddDetails';

class App extends Component {
  render(){
    return(
      <Provider store={createStore(reducers, {}, applyMiddleware(ReduxThunk))}>
         <RootNav />
        { /* <AddDetails /> */}
      </Provider>
    )
  }
}

export default App;
