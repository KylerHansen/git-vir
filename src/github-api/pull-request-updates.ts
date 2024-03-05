import {awaitedForEach} from '@augment-vir/common';
import {log, runShellCommand} from '@augment-vir/node-js';
import {SimpleGit} from 'simple-git';
import {checkout, doesBranchExistLocally, fetchBranch, forcePush, rebaseOnto} from '../git/branch';
import {PullRequest} from './pull-request-data';

export async function updateStackedPullRequest({
    git,
    parentPullRequest,
    pullRequests,
    remoteName,
    isPostMerge,
}: {
    git: SimpleGit;
    parentPullRequest: Readonly<PullRequest>;
    pullRequests: ReadonlyArray<Readonly<PullRequest>>;
    remoteName: string;
    /**
     * Set to true only if the parent pull request has just been merged (rather than just been
     * updated). This indicates that any chained pull requests should rebase on that parent pull
     * request's _base_ branch rather than its _head_.
     */
    isPostMerge: boolean;
}): Promise<number> {
    const originalParentRef = parentPullRequest.headRefOid;

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

        if (isPostMerge) {
            await fetchBranch(git, {branchName: parentPullRequest.baseRefName, remoteName});
        }

        await checkout(git, childPullRequest.headRefName);
        await rebaseOnto(
            git,
            isPostMerge
                ? {
                      newRef: [
                          remoteName,
                          parentPullRequest.baseRefName,
                      ].join('/'),
                      oldRef: originalParentRef,
                  }
                : {
                      newRef: parentPullRequest.headRefName,
                      oldRef: originalParentRef,
                  },
        );
        await forcePush(git);
        log.success(`${childBranchName} updated.`);

        updatedChildCount += await updateStackedPullRequest({
            git,
            pullRequests,
            parentPullRequest: childPullRequest,
            remoteName,
            /** Only the first update should ever use the base ref. Recursive calls never will. */
            isPostMerge: false,
        });
    });

    return updatedChildCount;
}

export async function mergeCurrentPullRequest({
    cwd,
    pullRequestUrl,
    otherArgs,
}: {
    cwd: string;
    pullRequestUrl: string;
    otherArgs: ReadonlyArray<string>;
}) {
    const commandString = [
        'gh pr merge',
        ...otherArgs,
    ].join(' ');

    const commandResult = await runShellCommand(commandString, {
        cwd,
    });

    if (commandResult.error) {
        if (
            commandResult.stderr.includes(
                'is not mergeable: the base branch policy prohibits the merge',
            )
        ) {
            throw new Error(`Merge checks prevent merging. See ${pullRequestUrl} for details.`);
        } else {
            throw new Error(commandResult.stderr);
        }
    }
}
