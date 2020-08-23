import { Templates, Manifest, Specs, TemplateEngine } from "./types";

export class Generator {
  constructor(private engine: TemplateEngine, private templates: Templates) {}

  generateSpecs(manifest: Manifest): Specs {
    const result: Specs = {};
    for (const templateName of manifest.templates) {
      const template = this.templates[templateName];
      result[templateName] = this.engine.renderString(template, manifest.data);
    }
    return result;
  }
}
