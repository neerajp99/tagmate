import {CHAT_SCREEN_MOUNTED, CHAT_SCREEN_UNMOUNTED} from '../actions/types';

const INITIAL_STATE = {chatScreenActive: false};

export default (state = INITIAL_STATE, action) => {

  switch (action.type) {
    case CHAT_SCREEN_MOUNTED:
      return {...state, chatScreenActive: true};

    case CHAT_SCREEN_UNMOUNTED:
      return {...state, chatScreenActive: false};

    default:
      return state;
  }
}
