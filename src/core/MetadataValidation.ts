/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { MetadataResolver, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { JsToXml } from '@salesforce/source-deploy-retrieve/lib/src/convert/streams';
import * as fs from 'graceful-fs';
import { AnyArray } from '@salesforce/ts-types';
import { MetadataResult } from '../wrapper/interfaces';

export class MetadataValidation {
  private resolver: MetadataResolver;
  private result = {} as MetadataResult;
  private forceappComponentsToDelete: SourceComponent[] = [];

  public build(sourcedir: string, targetdir: string): MetadataResult {
    try {
      this.resolver = new MetadataResolver();
      this.result.tableMap = new Map<string, AnyArray>();
      const forceappComponents = this.getComponentsWithChildsFromPaths([sourcedir]);
      const srcComponentMap = this.getComponentsWithChildsFromPaths([targetdir]).map((comp) => this.simpleKey(comp));
      this.forceappComponentsToDelete = forceappComponents.filter(
        (comp) => srcComponentMap.includes(this.simpleKey(comp))
      );
      this.forceappComponentsToDelete.forEach((comp) => {
        const tableRow = [comp.type.id, comp.fullName] as AnyArray;
        this.result.tableMap.set(JSON.stringify(`${comp.type.id}#${comp.fullName}`), tableRow);
      });
      this.result.metaCount = this.forceappComponentsToDelete.length;
      this.result.hasError = false;
      return this.result;
    } catch (error) {
      this.result.hasError = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.result.message = JSON.stringify(error.message);
      return this.result;
    }
  }

  public async update(): Promise<void> {
    for (const component of this.forceappComponentsToDelete) {
      if (component.content && !component.type.children) {
        const stats = fs.lstatSync(component.content);
        if (stats.isDirectory()) {
          await fs.promises.rm(component.content, { recursive: true });
        } else if (fs.existsSync(component.content)) {
          await fs.promises.unlink(component.content);
        }
      }
      if (component.xml) {
        if (
          (component.parent &&
            (component.parent.type.strictDirectoryName === true || !component.parent.type.children)) ||
          (!component.parent && (component.type.strictDirectoryName === true || !component.type.children))
        ) {
          if (fs.existsSync(component.xml)) {
            await fs.promises.unlink(component.xml);
          }
        } else {
          if (component.parent?.name && component.type.xmlElementName) {
            const [x] = this.resolver.getComponentsFromPath(component.xml);
            const content = x.parseXmlSync();
            if (
              content[component.parent.name] &&
              Array.isArray(content[component.parent.name][component.type.xmlElementName])
            ) {
              content[component.parent.name][component.type.xmlElementName] = content[component.parent.name][
                component.type.xmlElementName
              ].filter((child: any) => child.fullName !== component.fullName);
            } else if (content[component.parent.name]){
               if(content[component.parent.name][component.type.xmlElementName]["fullName"] === component.fullName){
                content[component.parent.name] = {};
              }
            }
           await fs.promises.writeFile(component.xml, new JsToXml(content).read());
          }
        }
      }
    }
  }

  private getComponentsWithChildsFromPaths(paths: string[]): SourceComponent[] {
    const components: SourceComponent[] = [];
    for (const path of paths) {
      for (const component of this.resolver.getComponentsFromPath(path)) {
        if (!component.type.children) {
          components.push(component);
        } else {
          for (const child of component.getChildren()) {
            components.push(child);
          }
          if (component.type.strictDirectoryName === true) {
            components.push(component);
          }
        }
      }
    }
    return components;
  }

  private simpleKey(component: SourceComponent): string {
    return `${component.type.id}#${component.fullName}`;
  }
}
