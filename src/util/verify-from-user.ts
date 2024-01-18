import {askQuestion} from '@augment-vir/node-js';

/**
 * Asks for user permission to continue. If the user doesn't grant it, current execution is halted
 * (by throwing an error).
 */
export async function verifyFromUser() {
    const response = (await askQuestion('Continue? (y/n)')).trim().toLowerCase()[0];
    if (response === 'y') {
        return;
    } else {
        throw new Error('User denied.');
    }
}
