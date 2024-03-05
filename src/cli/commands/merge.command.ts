import {log} from '@augment-vir/node-js';
import {checkout} from '../../git/branch';
import {getCurrentBranchPullRequest} from '../../github-api/pull-request-data';
import {
    mergeCurrentPullRequest,
    updateStackedPullRequest,
} from '../../github-api/pull-request-updates';
import {CommandInputs} from '../command-inputs';

/** Perform the git-vir push command. */
export async function mergeCommand({
    cwd,
    git,
    remoteName,
    otherArgs,
}: Readonly<CommandInputs>): Promise<void> {
    const {currentPullRequest, openPullRequests, currentBranchName} =
        await getCurrentBranchPullRequest(cwd, git);

    if (!currentPullRequest) {
        throw new Error(
            `Cannot merge: no pull request found for current branch: ${currentBranchName}.`,
        );
    }

    log.faint(`Merging PR #${currentPullRequest.number}...`);
    await mergeCurrentPullRequest({cwd, pullRequestUrl: currentPullRequest.url, otherArgs});

    log.faint('Starting stacked diff update.');
    log.mutate('Do not run any git commands or modify any files.');

    await updateStackedPullRequest({
        git,
        pullRequests: openPullRequests,
        parentPullRequest: currentPullRequest,
        remoteName,
        isPostMerge: true,
    });

    /** Go back to the original branch after it's all done. */
    await checkout(git, currentBranchName);
}
