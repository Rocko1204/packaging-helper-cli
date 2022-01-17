import {flags, SfdxCommand } from '@salesforce/command';
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
const messages = Messages.loadMessages('@rocko/packaging-helper', 'project_dep');

export default class ProjectDep extends SfdxCommand {
  // get Description From Command JSON
  public static description = messages.getMessage('commandDescription');
  // example for Terminal
  public static examples = [`sfdx rocko:project:dependency`];
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


  private dependencyTable = new Table({
    head: ['Id', 'Current Package', 'Add Dependency'],
    colWidths: [5, 35, 35],
  });

  private projectValidation = new ProjectValidation();
  private buildResult = {} as ProjectResult;

  public async run(): Promise<void> {
    try {
      // Task 1
      const tasks = new Listr([
        {
          title: 'load sfdx-project.json',
          task: async () => {
            const projectJson = await this.project.retrieveSfdxProjectJson();
            this.buildResult = await this.projectValidation.build(projectJson);
            if (this.buildResult.hasError) {
              throw new Error(this.buildResult.message);
            }
          },
        },
      ]);
      // Task 2
      tasks.add({
        title: 'validate sfdx-project.json file for dependencies',
        // eslint-disable-next-line @typescript-eslint/require-await
        task: () => {
          this.buildResult = this.projectValidation.checkDepPackage();
        },
      });

       // Task 3
       tasks.add({
        title: 'add dependencies and update sfdx-project.json',
        // eslint-disable-next-line @typescript-eslint/require-await
        enabled: () => this.buildResult.depCounter > 0,
        skip: () => {
          if (!this.flags.change) {
            return 'please set --change flag for update';
          }
        },
        task: async () => {
          this.buildResult = this.projectValidation.updateDepPackage();
          await fs.writeFile('sfdx-project.json',JSON.stringify(this.buildResult.contents,null,3));
        },
      });

      await tasks.run();
      if (this.buildResult.tableMap.size > 0) {
        for (const value of this.buildResult.tableMap.values()) {
          this.dependencyTable.push(value);
        }
      }
      this.ux.styledHeader(`Check Successfully Finished For ${this.buildResult.packageCount} Packages`);
      if (this.buildResult.tableMap.size > 0 && !this.flags.change) {
        this.ux.styledHeader(`found wrong dependencies for ${this.buildResult.tableMap.size} packages`);
        this.ux.log(this.dependencyTable.toString());
        this.ux.styledHeader('cancel prozess with error code 1');
        this.exit(1);
      } else if (this.buildResult.tableMap.size > 0 && this.flags.change) {
        this.ux.styledHeader(`update successfull for ${this.buildResult.tableMap.size} dependencies`);
        this.ux.log(this.dependencyTable.toString());
      } else {
        this.ux.styledHeader('all done! sfdx-project.json ok. Nothing to update');
      }
    } catch (err) {
      this.ux.log(err.message);
      this.exit(1);
    }
  }
}
