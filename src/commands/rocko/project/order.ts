import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { Listr } from 'listr2';
import Table = require('cli-table');
import { ProjectValidation } from '../../../core/ProjectJsonValidation';
import { ProjectResult } from '../../../wrapper/interfaces';
import { promises as fs } from 'fs';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@rocko/packaging-helper', 'project_order');

export default class ProjectOrder extends SfdxCommand {
  // get Description From Command JSON
  public static description = messages.getMessage('commandDescription');
  // example for Terminal
  public static examples = [`sfdx rocko:project:order --change`];
  // Required Settings
  protected static requiresProject = true;
  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    change: flags.boolean({
      char: 'c',
      required: false,
      description: messages.getMessage('changeFlagDescription'),
    }),
  };

  private orderTable = new Table({
    head: ['PackageIndex', 'Current Package', 'Dependency Index', 'Dependency Package'],
    colWidths: [15, 35, 20, 35],
  });

  private projectValidation = new ProjectValidation();
  private buildResult = {} as ProjectResult;

  public async run(): Promise<void> {
    try {
      // Task 1
      const tasks = new Listr([
        {
          title: `load sfdx-project.json`,
          task: async () => {
            const projectJson = await this.project.retrieveSfdxProjectJson();
            this.buildResult = await this.projectValidation.build(projectJson);
            if (this.buildResult.hasError) {
              throw new Error(this.buildResult.message);
            }
          },
        },
      ]);

      tasks.add([
        {
          title: 'validate sfdx-project.json',
          task: () => {
            this.buildResult = this.projectValidation.validatePackage();
          },
        },
      ]);

      tasks.add([
        {
          title: 'update order dependencies',
          skip: () => {
            if (!this.flags.change) {
              return 'please set --change flag for update';
            }
          },
          task: async () => {
            let i = 0;
            do {
              i += 1;
              this.buildResult = this.projectValidation.orderPackage();
            } while (i < 50 && this.buildResult.hasWrongOrder);
            await fs.writeFile('sfdx-project.json',JSON.stringify(this.buildResult.contents,null,3));
          },
        },
      ]);

      await tasks.run();
      if (this.buildResult.tableMap.size > 0) {
        for (const value of this.buildResult.tableMap.values()) {
          this.orderTable.push(value);
        }
      }
      this.ux.styledHeader(`check finished for ${this.buildResult.packageCount} packages`);
      if (this.buildResult.tableMap.size > 0 && !this.flags.change) {
        this.ux.styledHeader(`found wrong order for ${this.buildResult.tableMap.size} packages`);
        this.ux.log(this.orderTable.toString());
        this.ux.styledHeader('cancel prozess with error code 1');
        this.exit(1);
      } else if (this.buildResult.tableMap.size > 0 && this.flags.change) {
        this.ux.styledHeader(`update successfull for ${this.buildResult.tableMap.size} packages`);
        this.ux.log(this.orderTable.toString());
      } else {
        this.ux.styledHeader('all done! sfdx-project.json ok. Nothing to update');
      }
    } catch (err) {
      this.ux.log(err.message);
    }
  }
}
