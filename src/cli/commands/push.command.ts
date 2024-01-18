import {awaitedForEach} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {SimpleGit} from 'simple-git';
import {
    checkout,
    doesBranchExistLocally,
    fetchBranch,
    forcePush,
    getCurrentBranchName,
    rebaseOnto,
} from '../../git/branch';
import {PullRequest, listOpenPullRequests} from '../../github-api/pull-request';
import {CommandInputs} from '../command-inputs';

/** Perform the git-vir push command. */
export async function pushCommand({cwd, git, remoteName}: CommandInputs): Promise<void> {
    const originalBranchName = await getCurrentBranchName(git);

    if (!originalBranchName) {
        throw new Error('Cannot push: you are currently not on a branch.');
    }

    const openPullRequests = await listOpenPullRequests(cwd);

    const currentPullRequest: Readonly<PullRequest> | undefined = openPullRequests.find(
        (pullRequest) => pullRequest.headRefName === originalBranchName,
    );

    if (!currentPullRequest) {
        log.info(
            `No pull request found for branch '${originalBranchName}'. Performing a force push only.`,
        );
        await forcePush(git);
        return;
    }
    log.faint('Pushing current branch...');
    await forcePush(git);

    log.faint('Started stacked diff update.');
    log.mutate('Do not run any git commands or modify any files.');

    await updateStackedPullRequest(git, openPullRequests, currentPullRequest, remoteName);

    /** Go back to the original branch after it's all done. */
    await checkout(git, originalBranchName);
}

async function updateStackedPullRequest(
    git: SimpleGit,
    pullRequests: ReadonlyArray<Readonly<PullRequest>>,
    parentPullRequest: Readonly<PullRequest>,
    remoteName: string,
): Promise<number> {
    const originalParentSha = parentPullRequest.headRefOid;
    const childPullRequests = pullRequests.filter(
        (pullRequest) => pullRequest.baseRefName === parentPullRequest.headRefName,
    );
    if (!childPullRequests.length) {
        return 0;
    }

    log.faint(`${childPullRequests.length} child PRs detected.`);

    let updatedChildCount = childPullRequests.length;

    await awaitedForEach(childPullRequests, async (childPullRequest) => {
        const childBranchName = childPullRequest.headRefName;
        log.info(`Updating ${childBranchName}...`);
        if (!(await doesBranchExistLocally(git, childBranchName))) {
            log.faint(`${childBranchName} does not exist locally. Fetching from ${remoteName}...`);
            await fetchBranch(git, {branchName: childBranchName, remoteName});
        }
        await checkout(git, childPullRequest.headRefName);
        await rebaseOnto(git, {
            newSha: parentPullRequest.headRefName,
            oldSha: originalParentSha,
        });
        await forcePush(git);
        log.success(`${childBranchName} updated.`);

        updatedChildCount += await updateStackedPullRequest(
            git,
            pullRequests,
            childPullRequest,
            remoteName,
        );
    });

    return updatedChildCount;
}
