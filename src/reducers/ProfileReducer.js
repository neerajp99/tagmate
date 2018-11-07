import {
    FETCH_ALL_SERVICES,
    FETCH_ALL_SERVICES_FAILURE,
    FETCH_ALL_SERVICES_SUCCESS,
    SUBMIT_SERVICES
} from '../actions/types';

const INITIAL_STATE = {};

export default (state = INITIAL_STATE, action) => {

    switch (action.type) {
        case SUBMIT_SERVICES:
            return INITIAL_STATE;

        case FETCH_ALL_SERVICES:
            return {...state, fetching: true};

        case FETCH_ALL_SERVICES_SUCCESS:
            console.log('FETCH_ALL_SERVICES_SUCCESS', action)
            return {...state, fetching: false, services: action.payload};

        case FETCH_ALL_SERVICES_FAILURE:
            console.log('FETCH_ALL_SERVICES_FAIL', action)
            return {...state, fetching: false, error: action.payload};

        default:
            return state;
    }
}
