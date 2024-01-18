import {dirname, join} from 'path';

export const repoRootDir = dirname(__dirname);
export const notCommittedDir = join(repoRootDir, '.not-committed');
