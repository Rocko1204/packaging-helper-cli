/* eslint-disable @typescript-eslint/no-unsafe-call */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SfdxProjectJson, PackageDir } from '@salesforce/core';
import { ProjectJson } from '@salesforce/core/lib/sfdxProject';
import { ensureArray, JsonMap, AnyArray } from '@salesforce/ts-types';
import { ProjectResult, PackageDependency } from '../wrapper/interfaces';

export class ProjectValidation {
  protected static requiresProject = false;

  private contents = {} as ProjectJson;
  private result = {} as ProjectResult;

  public build(projectJson: SfdxProjectJson): ProjectResult {
    try {
      this.contents = projectJson.getContents();
      this.result.hasPackages = projectJson.hasPackages();
      this.result.hasMultiplePackages = projectJson.hasMultiplePackages();
      if (!this.result.hasPackages || !this.result.hasMultiplePackages) {
        throw new Error('no packges in sfdx-project.json');
      }
      const packageDirectories = ensureArray(this.contents.packageDirectories);
      this.result.packageCount = packageDirectories.length;
      this.result.hasError = false;
      return this.result;
    } catch (error) {
      this.result.hasError = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.result.message = JSON.stringify(error.message);
      return this.result;
    }
  }

  public validatePackage(): ProjectResult {
    const packageIndexMap = new Map<string, number>();
    const dictionaryIndexMap = new Map<string, JsonMap>();
    this.result.tableMap = new Map<string, AnyArray>();
    let hasWrongOrder = false;
    let i = 0;
    do {
      i += 1;
      let packageCounter = 0;
      let packagesList: JsonMap[] = ensureArray(this.contents.packageDirectories as JsonMap[]);
      for (const packageObj of packagesList) {
        packageCounter += 1;
        packageIndexMap.set(packageObj.package as string, packageCounter);
        dictionaryIndexMap.set(packageObj.package as string, packageObj);
      }
      // loop the package dictionaries and find wrong orders
      for (const packageOut of packagesList) {
        if (packageOut.dependencies) {
          for (const packageDep of packageOut.dependencies as JsonMap[]) {
            for (const packageInner of packagesList) {
              if (packageInner.package === packageDep.package) {
                if (
                  packageIndexMap.get(packageInner.package as string) >
                  packageIndexMap.get(packageOut.package as string)
                ) {
                  hasWrongOrder = true;
                  const tableRow = [
                    packageIndexMap.get(packageOut.package as string),
                    packageOut.package as string,
                    packageIndexMap.get(packageInner.package as string),
                    packageDep.package as string,
                  ] as AnyArray;
                  this.result.tableMap.set(
                    JSON.stringify(`${packageInner.package as string}#${packageDep.package as string}`),
                    tableRow
                  );

                  dictionaryIndexMap.delete(packageOut.package as string);
                  dictionaryIndexMap.set(packageOut.package as string, packageOut);
                }
              }
            }
          }
        }
      }
      packagesList = [];
      packagesList = [...dictionaryIndexMap.values()];
    } while (i < 5 && hasWrongOrder);
    this.result.dictionaryMap = dictionaryIndexMap;
    this.result.contents = this.contents;
    return this.result;
  }

  public orderPackage(): ProjectResult {
    const packageIndexMap = new Map<string, number>();
    const dictionaryIndexMap = new Map<string, JsonMap>();
    this.result.hasWrongOrder = false;
    let packageCounter = 0;
    let packagesList: JsonMap[] = ensureArray(this.contents.packageDirectories as JsonMap[]);
    for (const packageObj of packagesList) {
      packageCounter += 1;
      packageIndexMap.set(packageObj.package as string, packageCounter);
      dictionaryIndexMap.set(packageObj.package as string, packageObj);
    }
    // loop the package dictionaries and find wrong orders
    for (const packageOut of packagesList) {
      if (packageOut.dependencies) {
        for (const packageDep of packageOut.dependencies as JsonMap[]) {
          for (const packageInner of packagesList) {
            if (packageInner.package === packageDep.package) {
              if (
                packageIndexMap.get(packageInner.package as string) > packageIndexMap.get(packageOut.package as string)
              ) {
                this.result.hasWrongOrder = true;
                dictionaryIndexMap.delete(packageOut.package as string);
                dictionaryIndexMap.set(packageOut.package as string, packageOut);

                packagesList = [];
                packagesList = [...dictionaryIndexMap.values()];
                this.result.dictionaryMap = dictionaryIndexMap;
                this.result.contents = this.contents;
                this.contents.packageDirectories = packagesList as PackageDir[];
                return this.result;
              }
            }
          }
        }
      }
    }
    return this.result;
  }

  public checkDepPackage(): ProjectResult {
    this.result.depCounter = 0;
    let packagesList: JsonMap[] = ensureArray(this.contents.packageDirectories as JsonMap[]);
    this.result.tableMap = new Map<string, AnyArray>();
    for (const packageObj of packagesList) {
      if (packageObj.dependencies) {
        const currentDependencyMap = new Map<string, string>();
        for (const dependencyObj of packageObj.dependencies as JsonMap[]) {
          currentDependencyMap.set(dependencyObj.package as string, dependencyObj.package as string);
        }
        const correctDependencyListMap = this.checkDependencies(currentDependencyMap);
        for (const key of correctDependencyListMap.keys()) {
          //
          const check = currentDependencyMap.get(key);
          if (!check) {
            this.result.depCounter += 1;
            const tableRow = [
              this.result.depCounter,
              packageObj.package,
              correctDependencyListMap.get(key).package,
              correctDependencyListMap.get(key).version ? correctDependencyListMap.get(key).version : '',
              correctDependencyListMap.get(key).index,
            ] as AnyArray;
            this.result.tableMap.set(JSON.stringify(`${packageObj.package as string}#${key}`), tableRow);
          }
        }
      }
    }
    return this.result;
  }

  public updateDepPackage(): ProjectResult {
    if (this.result.tableMap.size > 0) {
      let packagesList: JsonMap[] = ensureArray(this.contents.packageDirectories as JsonMap[]);
      for (const value of this.result.tableMap.values()) {
        for (const packageObj of packagesList) {
          if (packageObj.package === value[1]) {
            const depObj = { package: value[2], versionNumber: value[3] };
            if (Array.isArray(packageObj.dependencies)) {
              packageObj.dependencies.splice(value[4] as number, 0, depObj as {});
            }
          }
        }
      }
    }
    this.result.contents = this.contents;
    return this.result;
  }

  private checkDependencies(depInputMap: Map<string, string>): Map<string, PackageDependency> {
    let postionIndex = 0;
    const newListMap = new Map<string, PackageDependency>();
    let packagesList: JsonMap[] = ensureArray(this.contents.packageDirectories as JsonMap[]);
    for (const depInput of depInputMap.values()) {
      postionIndex += 1;
      //let packIndex = 0;
      packagesList.forEach((packageObj) => {
        //packIndex += 1;
        if (depInput === packageObj.package) {
          if (packageObj.dependencies) {
            for (const packageObjDepList of packageObj.dependencies as JsonMap[]) {
              if (newListMap.get(packageObjDepList.package as string) === undefined) {
                const packageDepObj = {
                  package: packageObjDepList.package as string,
                  version: packageObjDepList.versionNumber as string,
                  index: postionIndex - 1,
                };
                newListMap.set(packageObjDepList.package as string, packageDepObj);
              }
            }
          }
        }
      });
    }
    return newListMap;
  }
}
