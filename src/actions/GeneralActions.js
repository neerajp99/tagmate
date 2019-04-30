import {CHAT_SCREEN_MOUNTED, CHAT_SCREEN_UNMOUNTED} from './types';

export const chatScreenMounted = () => {
  return {type: CHAT_SCREEN_MOUNTED};
};

export const chatScreenUnmounted = () => {
  return {type: CHAT_SCREEN_UNMOUNTED};
}
