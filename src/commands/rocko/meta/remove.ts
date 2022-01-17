import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { Listr } from 'listr2';
import Table = require('cli-table');
import { MetadataValidation } from '../../../core/MetadataValidation';
import { MetadataResult } from '../../../wrapper/interfaces';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@rocko/packaging-helper', 'meta_remove');

export default class MetaRemove extends SfdxCommand {
  // get Description From Command JSON
  public static description = messages.getMessage('commandDescription');
  // example for Terminal
  public static examples = [`sfdx rocko:meta:remove --change,sfdx rocko:meta:remove --patch 'force-app-pre'`];
  // Required Settings
  protected static requiresProject = true;

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    path: flags.string({
      char: 'p',
      required: false,
      description: messages.getMessage('pathFlagDescription'),
    }),
    change: flags.boolean({
      char: 'c',
      required: false,
      description: messages.getMessage('changeFlagDescription'),
    }),
  };

  private removeTable = new Table({
    head: ['MetaData Id', 'Component Name'],
    colWidths: [40, 50],
  });

  private metaValidation = new MetadataValidation();
  private metaResult = {} as MetadataResult;

  public async run(): Promise<void> {
    try {
      // Task 1
      const tasks = new Listr([
        {
          title: 'validate metadata from project',
          task: async () => {
            this.metaResult = await this.metaValidation.build(this.flags.path);
            if (this.metaResult.hasError) {
              throw new Error(this.metaResult.message);
            }
          },
        },
      ]);
      // Task 2
      tasks.add([
        {
          title: 'remove metadata',
          skip: () => {
            if (!this.flags.change) {
              return 'please set --change flag for update';
            }
          },
          task: async () => {
            await this.metaValidation.update();
          },
        },
      ]);

      await tasks.run();
      if (this.metaResult.metaCount > 0 && !this.flags.change) {
        for (const value of this.metaResult.tableMap.values()) {
          this.removeTable.push(value);
        }
        this.ux.log(this.removeTable.toString());
        this.ux.styledHeader(`found ${this.metaResult.metaCount} to remove`);
        this.ux.styledHeader('process error with exit code 1!');
        this.exit(1);
      } else if (this.metaResult.metaCount > 0 && this.flags.change) {
        for (const value of this.metaResult.tableMap.values()) {
            this.removeTable.push(value);
          }  
        this.ux.log(this.removeTable.toString());
        this.ux.styledHeader(`remove ${this.metaResult.metaCount} components`);
        this.ux.styledHeader('process finished and remove done!');
      }else {
        this.ux.styledHeader('process finished!');
        this.ux.styledHeader('all done! metadata ok. Nothing to remove');
      }
    } catch (err) {
      this.ux.log(err.message);
      this.ux.styledHeader('process error with exit code 1!');
      this.exit(1);
    }
  }
}
