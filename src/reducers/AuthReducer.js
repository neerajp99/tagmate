import { LOGIN_USER_SUCCESS, LOGIN_USER_FAIL, LOGIN_USER, SIGNUP_USER_SUCCESS} from '../actions/types';

const INITIAL_STATE = {user: null, error: '', success: false, loading:false};

export default (state = INITIAL_STATE, action) => {

  switch (action.type) {
    case LOGIN_USER_SUCCESS:
      return {...state, ...INITIAL_STATE, success: true, user: action.payload};

    case LOGIN_USER_FAIL:
      return {...state, error: 'Authentication Failed', success: false, loading: false};

    case LOGIN_USER:
      return {...state, loading: true, error: ''};

    case SIGNUP_USER_SUCCESS:
      return {...state, ...INITIAL_STATE, user: action.payload};

    default:
      return state;
  }
}
