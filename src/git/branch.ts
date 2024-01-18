import {log} from '@augment-vir/node-js';
import {SimpleGit} from 'simple-git';
import {verifyFromUser} from '../util/verify-from-user';

/** Get the current branch name. */
export async function getCurrentBranchName(git: SimpleGit): Promise<string | undefined> {
    const branchName = (
        await git.raw([
            'branch',
            '--show-current',
        ])
    ).trim();

    return branchName || undefined;
}

/** Force push the current branch. */
export async function forcePush(git: SimpleGit): Promise<void> {
    log.faint('> git push --force-with-lease');
    await verifyFromUser();
    await git.push([
        '--force-with-lease',
    ]);
}

/** Checkout a new branch locally. Does not fetch the branch from the remote. */
export async function checkout(git: SimpleGit, branchName: string): Promise<void> {
    log.faint(`> git checkout ${branchName}`);
    await verifyFromUser();
    await git.raw([
        'checkout',
        branchName,
    ]);
}

/** Fetch a branch from remote. */
export async function fetchBranch(
    git: SimpleGit,
    {
        remoteName,
        branchName,
    }: {
        remoteName: string;
        branchName: string;
    },
): Promise<void> {
    log.faint(`> git fetch ${remoteName} ${branchName}`);
    await verifyFromUser();
    await git.fetch(remoteName, branchName);
}

/**
 * Check if a branch exists locally or not. This does not count branches that have been fetched from
 * remote but have never been checked out from remote.
 */
export async function doesBranchExistLocally(git: SimpleGit, branchName: string): Promise<boolean> {
    const output = (
        await git.raw([
            'show-ref',
            '--quiet',
            `refs/heads/${branchName}`,
        ])
    ).trim();
    return !!output;
}

/** Perform a `git rebase --onto` command. */
export async function rebaseOnto(
    git: SimpleGit,
    {oldSha, newSha}: {oldSha: string; newSha: string},
): Promise<void> {
    log.faint(`> git rebase --onto ${newSha} ${oldSha}`);
    await verifyFromUser();
    await git.rebase([
        '--onto',
        newSha,
        oldSha,
    ]);
}
