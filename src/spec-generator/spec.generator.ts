import { Spec } from "../codefresh/types";
import { Template, Manifest, TemplateEngine, YamlEngine } from "./types";
import { Logger } from "../types";

export class SpecGenerator {
  constructor(
    private logger: Logger,
    private templater: TemplateEngine,
    private yaml: YamlEngine,
    private templates: Template[]
  ) {}

  generateSpecs(manifest: Manifest): Spec[] {
    const specs: Spec[] = [];
    for (const templateInfo of manifest.file.content.templates) {
      const template = this.getTemplate(templateInfo.name);
      const spec = this.generateSpec(manifest, template);
      specs.push(spec);
    }
    return specs;
  }

  generateSpec(manifest: Manifest, template: Template): Spec {
    const resultString = this.templater.renderString(
      template.file.content,
      manifest.file.content.data
    );
    let result: any;

    if (template.file.type === "JSON") {
      result = JSON.parse(resultString);
    } else if (template.file.type === "YAML") {
      result = this.yaml.parse(resultString);
      if (!result) {
        result = {};
      }
    } else {
      throw new Error(
        `template of type '${template.file.type}' not implemented`
      );
    }

    if (this.isMissingMetadata(result)) {
      result = this.addMetadata(result);
    }
    if (this.isMissingMetadataLabels(result)) {
      result = this.addMetadataLabels(result);
    }
    result = this.addChecksums(result, manifest, template);
    return result;
  }

  private getTemplate(name: string): Template {
    for (const template of this.templates) {
      if (template.name === name) {
        return template;
      }
    }
    this.logger.debug(
      `${this.logger.namespace}: getTemplate: template not found`
    );
    throw new Error("template not found");
  }

  private isMissingMetadata(result: any): boolean {
    return !result.metadata;
  }

  private isMissingMetadataLabels(result: any): boolean {
    return this.isMissingMetadata(result) || !result.metadata.labels;
  }

  private addMetadata(result: any): any {
    return {
      ...result,
      metadata: {},
    };
  }

  private addMetadataLabels(result: any): any {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        labels: {},
      },
    };
  }

  private addChecksums(
    result: any,
    manifest: Manifest,
    template: Template
  ): any {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        labels: {
          ...result.metadata.labels,
          checksumManifest: manifest.file.checksum,
          checksumTemplate: template.file.checksum,
        },
      },
    };
  }
}
