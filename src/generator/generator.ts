import { Templates, Manifest, Specs, TemplateEngine } from "./types";

export class Generator {
  constructor(private engine: TemplateEngine, private templates: Templates) {}

  generateSpecs(manifest: Manifest): Specs {
    const result: Specs = {};
    for (const templateName of manifest.templates) {
      const template = this.getTemplate(templateName);
      result[templateName] = this.generateSpec(template, manifest.data);
    }
    return result;
  }

  private getTemplate(name: string): string {
    return this.templates[name];
  }

  private generateSpec(template: string, data: any): string {
    return this.engine.renderString(template, data);
  }
}
