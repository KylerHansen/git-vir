# git-vir

CLI tool for making life with git and GitHub easier.

Requires the GitHub CLI to be installed and authenticated.

# How to setup

1. Install GitHub CLI: https://github.com/cli/cli#installation
2. Authenticate GitHub CLI: `gh auth login`
3. Install this package (probably globally): `npm i -g git-vir`

# How to use

## Push

Use this when you have a chain of several PRs that are targeting each other and they all need to be updated after the base PR is updated.

1. Start with the base-most branch (the branch closest to your main dev branch) that needs to be updated.
2. Make the necessary changes to that branch (rebase, commit amend, etc.).
3. Run `git-vir push`.
4. Approve each change as it's listed.
    - These requests for approval are used to prevent anything catastrophically wrong from happening since this will be modify your git history with rebases and force pushes.
5. Don't do anything else in the repo's directory. The git-vir command will checkout and push all dependent branches, recursively.
