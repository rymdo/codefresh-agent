import { SDK, Spec } from "./types";
import { Logger } from "../types";

export class Codefresh {
  constructor(private sdk: SDK, private logger: Logger) {}

  async createPipelines(specs: Spec[]): Promise<void> {
    for (const spec of specs) {
      if (await this.pipelineExists(spec)) {
        this.logger.info(
          `${this.logger.namespace}: pipeline '${spec.metadata.name}' already exists`
        );
      } else {
        await this.sdk.pipelines.create(spec);
        this.logger.info(
          `${this.logger.namespace}: pipeline '${spec.metadata.name}' created`
        );
      }
    }
  }

  async updatePipelines(specs: Spec[]): Promise<void> {
    for (const spec of specs) {
      await this.updatePipeline(spec);
    }
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
        `${this.logger.namespace}: unable to update pipeline '${spec.metadata.name}'`
      );
      this.logger.error(
        `${this.logger.namespace}: reason: '${err.toString()}'`
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

  private async pipelineExists(spec: Spec): Promise<boolean> {
    const result = await this.sdk.pipelines.get({
      name: spec.metadata.name,
    });
    if (this.isSpecList(result)) {
      if (this.isEmptySpecList(result)) {
        return false;
      }
      for (const remoteSpec of result) {
        if (remoteSpec.metadata.name === spec.metadata.name) {
          return true;
        }
      }
    } else if (this.isSpec(result)) {
      if (result.metadata.name === spec.metadata.name) {
        return true;
      }
    }
    return false;
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
    throw new Error("pipeline not found");
  }

  private isEmptySpecList(result: Spec[]): boolean {
    return result.length === 0;
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
    return true;
  }
}
