import { Codefresh } from "../codefresh/codefresh";
import { Loader } from "../loader/loader";
import { Logger } from "../types";
import { SpecGenerator } from "../spec-generator/spec.generator";
import { CliParameters } from "./types";
import { Manifest, Template } from "../spec-generator/types";
import { Spec } from "../codefresh/types";

export class Cli {
  constructor(
    private logger: Logger,
    private loader: Loader,
    private generator: SpecGenerator,
    private codefresh: Codefresh
  ) {}

  async exec(parameters: CliParameters): Promise<void> {
    const manifests = await this.getManifests(parameters);
    const templates = await this.getTemplates(parameters);
    const specs = this.generateSpecs(manifests, templates);
    await this.createPipelines(specs);
    await this.updatePipelines(specs);
  }

  private async updatePipelines(specs: Spec[]): Promise<void> {
    this.logger.info(
      `${this.logger.namespace}: Creating pipelines from ${specs.length} spec files`
    );
    return this.codefresh.updatePipelines(specs);
  }

  private async createPipelines(specs: Spec[]): Promise<void> {
    this.logger.info(
      `${this.logger.namespace}: Updating pipelines from ${specs.length} spec files`
    );
    return this.codefresh.createPipelines(specs);
  }

  private async getManifests(parameters: CliParameters): Promise<Manifest[]> {
    this.logger.info(
      `${this.logger.namespace}: Loading manifests from ${parameters.manifestsPath}`
    );
    return this.loader.loadManifests(parameters.manifestsPath);
  }

  private async getTemplates(parameters: CliParameters): Promise<Template[]> {
    this.logger.info(
      `${this.logger.namespace}: Loading templates from ${parameters.manifestsPath}`
    );
    return this.loader.loadTemplates(parameters.templatesPath);
  }

  private generateSpecs(manifests: Manifest[], templates: Template[]): Spec[] {
    this.logger.info(
      `${this.logger.namespace}: Loading specs from ${manifests.length} manifest files`
    );
    const specs: Spec[] = [];
    for (const manifest of manifests) {
      const manifestSpecs = this.generator.generateSpecs(manifest, templates);
      specs.push(...manifestSpecs);
    }
    return specs;
  }
}
