import {v4 as uuidv4} from 'uuid';

export function getMe(): string {
    let me = localStorage.getItem('me');
    if (!me) {
        me = 'user' + uuidv4();
        localStorage.setItem('me', me);
    }
    return me;
}