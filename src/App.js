import React, {Component} from 'react';
import ReduxThunk from 'redux-thunk';
import reducers from './reducers';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';
import {RootNav} from './Router';

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
