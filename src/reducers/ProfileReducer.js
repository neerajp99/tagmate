import {SUBMIT_SERVICES} from '../actions/types';

const INITIAL_STATE = {};

export default (state = INITIAL_STATE, action) => {

  switch (action.type) {
    case SUBMIT_SERVICES:
      return INITIAL_STATE;

    default:
      return state;
  }
}
