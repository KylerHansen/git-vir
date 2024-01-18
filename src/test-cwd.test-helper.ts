import {readFileIfExists} from '@augment-vir/node-js';
import {join} from 'path';
import {notCommittedDir} from './repo-paths';

export async function loadTestCwd(): Promise<string | undefined> {
    return await readFileIfExists(join(notCommittedDir, 'test-cwd.txt'));
}
