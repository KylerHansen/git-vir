import {assert} from 'chai';
import {loadTestCwd} from '../test-cwd.test-helper';
import {listOpenPullRequests} from './pull-request-data';

describe(listOpenPullRequests.name, () => {
    it('gets pull requests', async () => {
        const testCwd = await loadTestCwd();
        const output = await listOpenPullRequests(testCwd || process.cwd());

        if (testCwd) {
            console.info(output);
            assert.isAbove(output.length, 1);
        }
    });
});
