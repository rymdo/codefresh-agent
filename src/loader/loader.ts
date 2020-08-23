import { FileSystem, Glob } from "./types";
import { Templates } from "../generator/types";

export class Loader {
  constructor(private fs: FileSystem, private glob: Glob) {}

  async loadTemplates(path: string): Promise<Templates> {
    const result: Templates = {};
    const templateFiles = await this.findTemplates(path);
    for (const file of templateFiles) {
      const templateData = this.fs.readFileSync(file);
      result[file] = `${templateData}`;
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
}
