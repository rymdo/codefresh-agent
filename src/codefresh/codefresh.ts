import { SDK, Spec } from "./types";
import { Logger } from "../types";

const ERROR_PIPELINE_NOT_FOUND = "pipeline not found";

export class Codefresh {
  constructor(private sdk: SDK, private logger: Logger) {}

  async createPipelines(specs: Spec[]): Promise<void> {
    for (const spec of specs) {
      await this.createPipeline(spec);
    }
  }

  async updatePipelines(specs: Spec[]): Promise<void> {
    for (const spec of specs) {
      await this.updatePipeline(spec);
    }
  }

  async createPipeline(spec: Spec): Promise<void> {
    const { name } = spec.metadata;
    this.logger.debug(`${this.logger.namespace}: createPipeline - '${name}' `);

    let exists = false;
    try {
      await this.getPipeline(name);
      exists = true;
    } catch (err) {
      if (!this.isErrorPipelineNotFound(err)) {
        this.logger.error(
          `${this.logger.namespace}: createPipeline - unable to create pipeline '${name}'`
        );
        this.logger.error(
          `${
            this.logger.namespace
          }: createPipeline - reason: '${err.toString()}'`
        );
        return;
      }
    }
    if (exists) {
      this.logger.info(
        `${this.logger.namespace}: pipeline '${name}' already exists created`
      );
      return;
    }
    await this.sdk.pipelines.create(spec);
    this.logger.info(`${this.logger.namespace}: pipeline '${name}' created`);
  }

  private isErrorPipelineNotFound(err: Error): boolean {
    return err.toString() === `Error: ${ERROR_PIPELINE_NOT_FOUND}`;
  }

  async updatePipeline(spec: Spec): Promise<void> {
    const { name } = spec.metadata;
    this.logger.debug(`${this.logger.namespace}: updatePipeline - '${name}' `);
    try {
      const existingPipeline = await this.getPipeline(name);
      if (this.hasChecksumManifestChanged(existingPipeline, spec)) {
        this.logger.info(
          `${this.logger.namespace}: updatePipeline - manifest checksum has changed for '${name}'`
        );
        await this.sdk.pipelines.update({ name }, spec);
        return;
      }
      if (this.hasChecksumTemplateChanged(existingPipeline, spec)) {
        this.logger.info(
          `${this.logger.namespace}: updatePipeline - template checksum has changed for '${name}'`
        );
        await this.sdk.pipelines.update({ name }, spec);
        return;
      }
      this.logger.info(
        `${this.logger.namespace}: updatePipeline - no changes to '${name}'`
      );
    } catch (err) {
      this.logger.error(
        `${this.logger.namespace}: updatePipeline - unable to update pipeline '${spec.metadata.name}'`
      );
      this.logger.error(
        `${this.logger.namespace}: updatePipeline - reason: '${err.toString()}'`
      );
    }
  }

  private hasChecksumManifestChanged(
    existingPipeline: Spec,
    spec: Spec
  ): boolean {
    return (
      existingPipeline.metadata.labels.caChecksumManifest !==
      spec.metadata.labels.caChecksumManifest
    );
  }

  private hasChecksumTemplateChanged(
    existingPipeline: Spec,
    spec: Spec
  ): boolean {
    return (
      existingPipeline.metadata.labels.caChecksumTemplate !==
      spec.metadata.labels.caChecksumTemplate
    );
  }

  private async getPipeline(name: string): Promise<Spec> {
    this.logger.debug(
      `${this.logger.namespace}: getPipeline - getting '${name}'`
    );
    const result = await this.sdk.pipelines.get({
      name,
    });
    this.logger.debug(`${this.logger.namespace}: getPipeline - got '${name}'`);
    if (this.isSpec(result)) {
      this.logger.debug(
        `${this.logger.namespace}: getPipeline - '${JSON.stringify(result)}'`
      );
      return result;
    }
    if (this.isSpecList(result)) {
      for (const spec of result) {
        if (spec.metadata.name === name) {
          this.logger.debug(
            `${this.logger.namespace}: getPipeline - '${JSON.stringify(spec)}'`
          );
          return spec;
        }
      }
    }
    throw new Error(ERROR_PIPELINE_NOT_FOUND);
  }

  private isSpecList(data: any): data is Spec[] {
    if (!data) {
      this.logger.debug(
        `${this.logger.namespace}: isSpecList - data is undefined`
      );
      return false;
    }
    if (!Array.isArray(data)) {
      this.logger.debug(`${this.logger.namespace}: isSpecList - is not array`);
      return false;
    }
    for (const entry of data) {
      if (!this.isSpec(entry)) {
        this.logger.debug(
          `${this.logger.namespace}: isSpecList - entry is wrong type`
        );
        return false;
      }
    }
    return true;
  }

  private isSpec(data: any): data is Spec {
    if (!data) {
      this.logger.debug(`${this.logger.namespace}: isSpec - data is undefined`);
      return false;
    }
    if (!data.version || !(typeof data.version === "string")) {
      this.logger.debug(
        `${
          this.logger.namespace
        }: isSpec - data.version is wrong type. Expected: 'string' Actual: '${typeof data.version}'`
      );
      return false;
    }
    if (!data.kind || !(typeof data.kind === "string")) {
      this.logger.debug(
        `${
          this.logger.namespace
        }: isSpec - data.kind is wrong type. Expected: 'string' Actual: '${typeof data.kind}'`
      );
      return false;
    }
    if (!data.metadata) {
      this.logger.debug(
        `${this.logger.namespace}: isSpec - data.metadata is undefined`
      );
      return false;
    }
    if (!data.metadata.name || !(typeof data.metadata.name === "string")) {
      this.logger.debug(
        `${
          this.logger.namespace
        }: isSpec - data.metadata.name is wrong type. Expected: 'string' Actual: '${typeof data
          .metadata.name}'`
      );
      return false;
    }
    if (!data.metadata.labels) {
      this.logger.debug(
        `${this.logger.namespace}: isSpec - data.metadata.labels is undefined`
      );
      return false;
    }
    if (
      !data.metadata.labels.caChecksumManifest ||
      !(typeof data.metadata.labels.caChecksumManifest === "string")
    ) {
      this.logger.debug(
        `${
          this.logger.namespace
        }: isSpec - data.metadata.labels.caChecksumManifest is wrong type. Expected: 'string' Actual: '${typeof data
          .metadata.labels.caChecksumManifest}'`
      );
      return false;
    }
    if (
      !data.metadata.labels.caChecksumTemplate ||
      !(typeof data.metadata.labels.caChecksumTemplate === "string")
    ) {
      this.logger.debug(
        `${
          this.logger.namespace
        }: isSpec - data.metadata.labels.caChecksumTemplate is wrong type. Expected: 'string' Actual: '${typeof data
          .metadata.labels.caChecksumTemplate}'`
      );
      return false;
    }
    return true;
  }
}
