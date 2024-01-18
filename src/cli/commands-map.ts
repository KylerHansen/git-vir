import {CommandInputs} from './command-inputs';
import {pushCommand} from './commands/push.command';

/** Available git-vir command names. To be used as the first argument to the gvir command. */
export enum GitVirCommandName {
    Push = 'push',
}

/** All command functions match this type. */
export type CommandFunction = (inputs: CommandInputs) => Promise<void>;

/** Mapping of git-vir commands to their functions. */
export const gitVirCommandFunctionMap: Readonly<Record<GitVirCommandName, CommandFunction>> = {
    [GitVirCommandName.Push]: pushCommand,
};
