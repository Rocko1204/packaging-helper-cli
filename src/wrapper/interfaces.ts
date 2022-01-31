import { JsonMap, AnyArray } from '@salesforce/ts-types';
import { ProjectJson } from '@salesforce/core/lib/sfdxProject';

export interface ProjectResult {
  hasError: boolean;
  message?: string;
  hasPackages: boolean;
  hasMultiplePackages: boolean;
  packageCount?: number;
  tableMap?: Map<string, AnyArray>;
  dictionaryMap?: Map<string, JsonMap>;
  contents?: ProjectJson;
  hasWrongOrder?: boolean;
  depCounter?: number;
}

export interface MetadataResult {
  hasError: boolean;
  message?: string;
  tableMap?: Map<string, AnyArray>;
  metaCount?: number;
}

export interface TableResult {
  packageId: number;
  packageName: string;
  depId: number;
  depName: string;
}

export interface PackageDependency {
  package: string;
  version: string;
  index: number;
}
