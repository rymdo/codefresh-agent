/* eslint max-classes-per-file: "off" */
declare module "codefresh-sdk" {
  export class Codefresh {
    configure(config: any): any;

    pipelines: any;

    projects: any;
  }
  export class Config {
    static fromCodefreshConfig(): any;
  }
}
