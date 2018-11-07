import {SET_DEVICE_TOKEN} from '../actions/types';

const INITIAL_STATE = {
  fetching: false,
};

export default (state = INITIAL_STATE, action) => {

  switch (action.type) {
    case SET_DEVICE_TOKEN:
      return INITIAL_STATE;

    default:
      return state;
  }
}
