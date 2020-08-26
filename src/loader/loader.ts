import { FileSystem, Glob } from "./types";
import { Templates } from "../generator/types";

export class Loader {
  constructor(private fs: FileSystem, private glob: Glob) {}

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

  private async findTemplates(path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.glob.find(`${path}/**/*.njk`, (err, files) => {
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
}
