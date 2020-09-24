import { Template, Manifest, TemplateEngine, YamlEngine, Spec } from "./types";
import { Logger } from "../types";
import { TypeCheck } from "../tools/typecheck";

export class SpecGenerator {
  constructor(
    private logger: Logger,
    private templater: TemplateEngine,
    private yaml: YamlEngine
  ) {}

  generateSpecs(manifest: Manifest, templates: Template[]): Spec[] {
    const specs: Spec[] = [];
    for (const templateInfo of manifest.file.content.templates) {
      const template = this.getTemplate(templateInfo.name, templates);
      const spec = this.generateSpec(manifest, template, templateInfo.alias);
      specs.push(spec);
    }
    return specs;
  }

  generateSpec(manifest: Manifest, template: Template, alias: string): Spec {
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

    if (!result) {
      this.logDebugTypeError(
        this.generateSpec.name,
        "result",
        "object{}",
        result
      );
      throw new Error(
        "Spec generated is malformed. Generated spec is unparsable."
      );
    }
    if (this.isMissingMetadata(result)) {
      this.logDebugTypeError(
        this.generateSpec.name,
        "result.metadata",
        "object{}",
        result.metadata
      );
      throw new Error(
        "Spec generated is malformed. Generated spec is missing 'metadata'."
      );
    }
    if (this.isMissingMetadataName(result)) {
      this.logDebugTypeError(
        this.generateSpec.name,
        "result.metadata.name",
        "string",
        result.metadata.name
      );
      throw new Error(
        "Spec generated is malformed. Generated spec is missing 'metadata.name'."
      );
    }
    if (this.isMissingMetadataProject(result)) {
      this.logDebugTypeError(
        this.generateSpec.name,
        "result.metadata.project",
        "string",
        result.metadata.project
      );
      throw new Error(
        "Spec generated is malformed. Generated spec is missing 'metadata.project'."
      );
    }
    result = this.addChecksums(result, manifest, template);
    result = this.appendAliasToName(result, alias);
    return result;
  }

  private getTemplate(name: string, templates: Template[]): Template {
    for (const template of templates) {
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

  private isMissingMetadataName(data: any): boolean {
    return !TypeCheck.isString(data.metadata.name);
  }

  private isMissingMetadataProject(data: any): boolean {
    return !TypeCheck.isString(data.metadata.project);
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
        description: JSON.stringify({
          checksumManifest: manifest.file.checksum,
          checksumTemplate: template.file.checksum,
        }),
      },
    };
  }

  private appendAliasToName(spec: Spec, alias: string): Spec {
    return {
      ...spec,
      metadata: {
        ...spec.metadata,
        name: `${spec.metadata.name}-${alias.replace(/[\W_]+/g, "-")}`,
      },
    };
  }

  private logDebugTypeError(
    functionName: string,
    variableName: string,
    expectedType: string,
    variable: any
  ): void {
    try {
      this.logger.debug(
        `${
          this.logger.namespace
        }: ${functionName} - ${variableName} is wrong type. Expected: '${expectedType}' Actual: '${typeof variable}'`
      );
    } catch (e) {
      //
    }
  }
}
