import {combineReducers} from 'redux';
import AuthReducer from './AuthReducer';
import ProfileReducer from './ProfileReducer';
import ConfigReducer from "./ConfigReducer";
import GeneralReducer from "./GeneralReducer";

export default combineReducers({
    auth: AuthReducer,
    profile: ProfileReducer,
    config: ConfigReducer,
    general: GeneralReducer,
});
