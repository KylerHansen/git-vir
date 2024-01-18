#!/usr/bin/env node

import {ensureError, getEnumTypedValues, isEnumValue} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {extractRelevantArgs} from 'cli-args-vir';
import simpleGit from 'simple-git';
import {CommandInputs} from './command-inputs';
import {GitVirCommandName, gitVirCommandFunctionMap} from './commands-map';

/**
 * Inputs required for the CLI to execute. When the CLI is run directly, these are automatically
 * read from command line arguments.
 */
export type CliInput = {
    command: GitVirCommandName;
    cwd: string;
    remoteName: string;
};

/** Runs the git-vir CLI. */
export async function runCli({command, cwd, remoteName}: CliInput) {
    const git = simpleGit(cwd);
    const commandFunction = gitVirCommandFunctionMap[command];

    const commandInputs: CommandInputs = {
        cwd,
        git,
        remoteName,
    };

    try {
        await commandFunction(commandInputs);
    } catch (caught) {
        console.error(caught);
        log.error(`${command} failed.`);
        throw ensureError(caught);
    }
}

/** Extracts arguments from a raw string of CLI args. */
export function extractArgs(rawArgs: ReadonlyArray<string>): CliInput {
    const [
        command,
        remoteName,
    ] = extractRelevantArgs({rawArgs, binName: 'git-vir', fileName: __filename});

    if (!isEnumValue(command, GitVirCommandName)) {
        throw new Error(
            `Invalid command given. Expected one of:\n    ${getEnumTypedValues(GitVirCommandName).join('\n    ')}`,
        );
    }
    return {
        command,
        remoteName: remoteName || 'origin',
        cwd: process.cwd(),
    };
}

if (require.main === module) {
    runCli(extractArgs(process.argv)).catch(() => {
        process.exit(1);
    });
}
