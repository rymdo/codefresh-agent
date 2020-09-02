import { FileSystem, Glob } from "./types";
import { Template, Manifest, ManifestContent } from "../spec-generator/types";

export class Loader {
  constructor(private fs: FileSystem, private glob: Glob) {}

  async loadManifests(path: string): Promise<Manifest[]> {
    const result: Manifest[] = [];
    const manifestFiles = await this.findManifests(path);
    for (const file of manifestFiles) {
      const manifest = JSON.parse(`${this.fs.readFileSync(file)}`);
      if (this.isManifestContent(manifest)) {
        result.push({
          file: {
            checksum: "123",
            content: manifest,
          },
        });
      } else {
        console.error(manifest);
      }
    }
    return result;
  }

  async loadTemplates(path: string): Promise<Template[]> {
    const result: Template[] = [];

    const templateFilesJSON = await this.findTemplatesJSON(path);
    for (const file of templateFilesJSON) {
      const templateData = this.fs.readFileSync(file);
      const fileClean = this.cleanFile(path, file);
      result.push({
        name: fileClean,
        file: {
          checksum: "123",
          content: `${templateData}`,
          type: "JSON",
        },
      });
    }

    const templateFilesYAML = await this.findTemplatesYAML(path);
    for (const file of templateFilesYAML) {
      const templateData = this.fs.readFileSync(file);
      const fileClean = this.cleanFile(path, file);
      result.push({
        name: fileClean,
        file: {
          checksum: "123",
          content: `${templateData}`,
          type: "YAML",
        },
      });
    }

    return result;
  }

  private async findManifests(path: string): Promise<string[]> {
    return this.findFiles(`${path}/**/manifest.json`);
  }

  private async findTemplatesJSON(path: string): Promise<string[]> {
    return this.findFiles(`${path}/**/*.json.njk`);
  }

  private async findTemplatesYAML(path: string): Promise<string[]> {
    return this.findFiles(`${path}/**/*.yaml.njk`);
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
    if (file.endsWith(".json")) {
      return file.slice(undefined, file.lastIndexOf(".json"));
    }
    if (file.endsWith(".json.njk")) {
      return file.slice(undefined, file.lastIndexOf(".json.njk"));
    }
    if (file.endsWith(".yaml.njk")) {
      return file.slice(undefined, file.lastIndexOf(".yaml.njk"));
    }
    return file;
  }

  private isManifestContent(obj: any): obj is ManifestContent {
    if (!obj || !obj.data || !obj.templates || !Array.isArray(obj.templates)) {
      return false;
    }
    for (const template of obj.templates) {
      if (!template.name) {
        return false;
      }
      if (!(typeof template.name === "string")) {
        return false;
      }
    }
    return true;
  }
}
