import { FileSystem, Glob } from "./types";
import { Templates, Manifests, Manifest } from "../generator/types";

export class Loader {
  constructor(private fs: FileSystem, private glob: Glob) {}

  async loadManifests(path: string): Promise<Manifests> {
    const result: Manifests = {};
    const manifestFiles = await this.findManifests(path);
    for (const file of manifestFiles) {
      const manifest = JSON.parse(`${this.fs.readFileSync(file)}`);
      if (this.isManifest(manifest)) {
        const fileClean = this.cleanFile(path, file);
        result[fileClean] = manifest;
      }
    }
    return result;
  }

  async loadTemplates(path: string): Promise<Templates> {
    const result: Templates = {};
    const templateFiles = await this.findTemplates(path);
    for (const file of templateFiles) {
      const templateData = this.fs.readFileSync(file);
      const fileClean = this.cleanFile(path, file);
      result[fileClean] = `${templateData}`;
    }
    return result;
  }

  private async findManifests(path: string): Promise<string[]> {
    return this.findFiles(`${path}/**/manifest.json`);
  }

  private async findTemplates(path: string): Promise<string[]> {
    return this.findFiles(`${path}/**/*.njk`);
  }

  private async findFiles(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.glob.find(`${pattern}`, (err, files) => {
        if (err) {
          return reject(err);
        }
        return resolve(files);
      });
    });
  }

  private cleanFile(path: string, file: string): string {
    let result = this.removeBasePath(path, file);
    result = this.removeFileEnding(result);
    return result;
  }

  private removeBasePath(path: string, file: string): string {
    if (file.indexOf(`${path}/`) === 0) {
      return file.slice(path.length + 1);
    }
    if (file.indexOf(path) === 0) {
      return file.slice(path.length);
    }
    return file;
  }

  private removeFileEnding(file: string): string {
    return file.replace(/\.[^/.]+$/, "");
  }

  private isManifest(obj: any): obj is Manifest {
    if (!obj || !obj.data || !obj.templates || !Array.isArray(obj.templates)) {
      return false;
    }
    for (const template of obj.templates) {
      if (!(typeof template === "string")) {
        return false;
      }
    }
    return true;
  }
}
