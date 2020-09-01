import {
  Templates,
  Manifest,
  Specs,
  TemplateEngine,
  YamlEngine,
  ChecksumEngine,
} from "./types";

export class Generator {
  constructor(
    private engine: TemplateEngine,
    private yaml: YamlEngine,
    private checksum: ChecksumEngine,
    private templates: Templates
  ) {}

  generateSpecs(manifest: Manifest): Specs {
    const result: Specs = {};
    for (const templateName of manifest.templates) {
      const template = this.getTemplate(templateName);
      const spec = this.generateSpec(template, manifest.data);
      const specWithChecksums = this.addChecksums(spec, manifest, template);
      result[templateName] = specWithChecksums;
    }
    return result;
  }

  private getTemplate(name: string): string {
    return this.templates[name];
  }

  private generateSpec(template: string, data: any): string {
    return this.engine.renderString(template, data);
  }

  private addChecksums(
    spec: string,
    manifest: Manifest,
    template: string
  ): string {
    const parsed = this.yaml.parse(spec);
    if (!parsed.metadata) {
      parsed.metadata = {};
    }
    if (!parsed.metadata.labels) {
      parsed.metadata.labels = {};
    }
    return this.yaml.stringify({
      ...parsed,
      metadata: {
        ...parsed.metadata,
        labels: {
          ...parsed.metadata.labels,
          ca_checksum_manifest: this.getManifestChecksum(manifest),
          ca_checksum_template: this.getTemplateChecksum(template),
        },
      },
    });
  }

  private getManifestChecksum(manifest: Manifest): string {
    return this.checksum.sha1(JSON.stringify(manifest));
  }

  private getTemplateChecksum(template: string): string {
    return this.checksum.sha1(template);
  }
}
