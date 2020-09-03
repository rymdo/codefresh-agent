import { SDK, Spec } from "./types";
import { Logger } from "../types";

export const PIPELINE_NOT_FOUND_ERROR = "PIPELINE_NOT_FOUND_ERROR";
export const PIPELINE_SPEC_MALFORMED_ERROR = "PIPELINE_SPEC_MALFORMED_ERROR";

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
    if (await this.pipelineExists(name)) {
      this.logger.info(
        `${this.logger.namespace}: pipeline '${name}' already exists created`
      );
      return;
    }
    await this.sdk.pipelines.create(spec);
    this.logger.info(`${this.logger.namespace}: pipeline '${name}' created`);
  }

  async updatePipeline(spec: Spec): Promise<void> {
    const { name } = spec.metadata;
    this.logger.debug(`${this.logger.namespace}: updatePipeline - '${name}' `);

    if (!(await this.pipelineExists(name))) {
      this.logger.error(
        `${this.logger.namespace}: updatePipeline - pipeline '${name}' does not exists`
      );
      throw new Error(PIPELINE_NOT_FOUND_ERROR);
    }

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
  }

  private async pipelineExists(name: string): Promise<boolean> {
    try {
      await this.getPipeline(name);
    } catch (err) {
      if (this.isErrorPipelineNotFound(err)) {
        return false;
      }
      throw err;
    }
    return true;
  }

  private hasChecksumManifestChanged(
    existingPipeline: Spec,
    spec: Spec
  ): boolean {
    return (
      existingPipeline.metadata.labels.checksumManifest !==
      spec.metadata.labels.checksumManifest
    );
  }

  private hasChecksumTemplateChanged(
    existingPipeline: Spec,
    spec: Spec
  ): boolean {
    return (
      existingPipeline.metadata.labels.checksumTemplate !==
      spec.metadata.labels.checksumTemplate
    );
  }

  private async getPipeline(name: string): Promise<Spec> {
    this.logger.debug(
      `${this.logger.namespace}: getPipeline - getting pipeline '${name}'`
    );
    let result: any;
    try {
      result = await this.sdk.pipelines.get({
        name,
      });
    } catch (err) {
      if (this.isCFErrorNoPipelineFound(err)) {
        throw new Error(PIPELINE_NOT_FOUND_ERROR);
      }
      throw err;
    }
    this.logger.debug(
      `${this.logger.namespace}: getPipeline - got pipeline '${name}'`
    );
    if (!this.isSpec(result)) {
      this.logger.debug(
        `${this.logger.namespace}: getPipeline - '${JSON.stringify(result)}'`
      );
      throw new Error(PIPELINE_SPEC_MALFORMED_ERROR);
    }
    return result;
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

  private isErrorPipelineNotFound(err: Error): boolean {
    return err.toString() === `Error: ${PIPELINE_NOT_FOUND_ERROR}`;
  }

  private isCFErrorNoPipelineFound(err: any): boolean {
    if (!err.name || !err.message) {
      return false;
    }
    let message: any = {};
    try {
      message = JSON.parse(err.message);
      message = JSON.parse(message);
    } catch (e) {
      return false;
    }
    if (!message || !message.name || !message.code) {
      return false;
    }
    if (message.name === "PIPELINE_NOT_FOUND_ERROR") {
      return true;
    }
    if (message.code === "4201") {
      return true;
    }
    return false;
  }
}
