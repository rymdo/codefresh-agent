import { SDK, SDKProject, SDKPipeline } from "./types";
import { Logger } from "../types";
import { TypeCheck } from "../tools/typecheck";

export const PROJECT_NOT_FOUND_ERROR = "PROJECT_NOT_FOUND_ERROR";
export const PROJECT_ALREADY_EXISTS = "PROJECT_ALREADY_EXISTS";
export const PROJECT_MALFORMED_ERROR = "PROJECT_MALFORMED_ERROR";

export const PIPELINE_NOT_FOUND_ERROR = "PIPELINE_NOT_FOUND_ERROR";
export const PIPELINE_SPEC_MALFORMED_ERROR = "PIPELINE_SPEC_MALFORMED_ERROR";

export class Codefresh {
  constructor(private sdk: SDK, private logger: Logger) {}

  async createProject(spec: SDKPipeline): Promise<void> {
    const { project } = spec.metadata;
    if (await this.projectExists(project)) {
      this.logger.debug(
        `${this.logger.namespace}: project '${project}' already created`
      );
      return;
    }
    await this.sdk.projects.create(project);
    this.logger.info(`${this.logger.namespace}: project '${project}' created`);
  }

  async createPipeline(spec: SDKPipeline): Promise<void> {
    const { name } = spec.metadata;
    if (await this.pipelineExists(name)) {
      this.logger.debug(
        `${this.logger.namespace}: pipeline '${name}' already created`
      );
      return;
    }
    await this.sdk.pipelines.create(spec);
    this.logger.info(`${this.logger.namespace}: pipeline '${name}' created`);
  }

  async updatePipeline(spec: SDKPipeline): Promise<void> {
    const { name } = spec.metadata;
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
    this.logger.debug(
      `${this.logger.namespace}: updatePipeline - no changes to '${name}'`
    );
  }

  private async projectExists(name: string): Promise<boolean> {
    try {
      await this.getProject(name);
      return true;
    } catch (err) {
      if (this.isProjectNotFoundError(err)) {
        return false;
      }
      throw err;
    }
  }

  private async pipelineExists(name: string): Promise<boolean> {
    try {
      await this.getPipeline(name);
      return true;
    } catch (err) {
      if (this.isErrorPipelineNotFound(err)) {
        return false;
      }
      throw err;
    }
  }

  private hasChecksumManifestChanged(
    existingPipeline: SDKPipeline,
    spec: SDKPipeline
  ): boolean {
    if (!existingPipeline.metadata.labels) {
      return true;
    }
    if (!existingPipeline.metadata.labels.checksumManifest) {
      return true;
    }
    if (!spec.metadata.labels) {
      return true;
    }
    if (!spec.metadata.labels.checksumTemplate) {
      return true;
    }
    return (
      existingPipeline.metadata.labels.checksumManifest !==
      spec.metadata.labels.checksumManifest
    );
  }

  private hasChecksumTemplateChanged(
    existingPipeline: SDKPipeline,
    spec: SDKPipeline
  ): boolean {
    if (!existingPipeline.metadata.labels) {
      return true;
    }
    if (!existingPipeline.metadata.labels.checksumTemplate) {
      return true;
    }
    if (!spec.metadata.labels) {
      return true;
    }
    if (!spec.metadata.labels.checksumTemplate) {
      return true;
    }
    return (
      existingPipeline.metadata.labels.checksumTemplate !==
      spec.metadata.labels.checksumTemplate
    );
  }

  private async getProject(name: string): Promise<SDKProject> {
    this.logger.debug(
      `${this.logger.namespace}: getProject - getting project '${name}'`
    );
    let result: any;
    try {
      result = await this.sdk.projects.get({
        name,
      });
    } catch (err) {
      if (this.isSDKProjectNotFoundError(err)) {
        this.logger.debug(
          `${this.logger.namespace}: getProject - project not found '${name}'`
        );
        throw new Error(PROJECT_NOT_FOUND_ERROR);
      }
      throw err;
    }
    if (!this.isSDKProject(result)) {
      this.logger.error(
        `${this.logger.namespace}: getProject - project malformed '${name}'`
      );
      throw new Error(PROJECT_MALFORMED_ERROR);
    }
    return result;
  }

  private async getPipeline(name: string): Promise<SDKPipeline> {
    this.logger.debug(
      `${this.logger.namespace}: getPipeline - getting pipeline '${name}'`
    );
    let result: any;
    try {
      result = await this.sdk.pipelines.get({
        name,
      });
    } catch (err) {
      if (this.isSDKErrorNoPipelineFound(err)) {
        throw new Error(PIPELINE_NOT_FOUND_ERROR);
      }
      throw err;
    }
    this.logger.debug(
      `${this.logger.namespace}: getPipeline - got pipeline '${name}'`
    );
    if (!this.isSDKPipeline(result)) {
      this.logger.debug(
        `${this.logger.namespace}: getPipeline - '${JSON.stringify(result)}'`
      );
      throw new Error(PIPELINE_SPEC_MALFORMED_ERROR);
    }
    return result;
  }

  private isSDKProject(data: any): data is SDKProject {
    if (!data) {
      this.logDebugTypeError(this.isSDKProject.name, "data", "object{}", data);
      return false;
    }
    if (!TypeCheck.isString(data.projectName)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.projectName",
        "string",
        data.projectName
      );
      return false;
    }
    return true;
  }

  private isSDKPipeline(data: any): data is SDKPipeline {
    if (!data) {
      this.logDebugTypeError(this.isSDKPipeline.name, "data", "object{}", data);
      return false;
    }
    if (!data.metadata) {
      this.logDebugTypeError(
        this.isSDKPipeline.name,
        "data.metadata",
        "object{}",
        data
      );
      return false;
    }
    if (!TypeCheck.isString(data.metadata.name)) {
      this.logDebugTypeError(
        this.isSDKPipeline.name,
        "data.metadata.name",
        "string",
        data.metadata.name
      );
      return false;
    }
    if (!TypeCheck.isString(data.metadata.project)) {
      this.logDebugTypeError(
        this.isSDKPipeline.name,
        "data.metadata.project",
        "string",
        data.metadata.project
      );
      return false;
    }
    return true;
  }

  private isProjectNotFoundError(err: Error): boolean {
    return err.toString() === `Error: ${PROJECT_NOT_FOUND_ERROR}`;
  }

  private isErrorPipelineNotFound(err: Error): boolean {
    return err.toString() === `Error: ${PIPELINE_NOT_FOUND_ERROR}`;
  }

  private isSDKProjectNotFoundError(err: any): boolean {
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
    if (!message || !message.name) {
      return false;
    }
    if (
      message.code === "1001" &&
      message.name === "INTERNAL_SERVER_ERROR" &&
      (message.message as string).startsWith("404")
    ) {
      return true;
    }
    return false;
  }

  private isSDKErrorNoPipelineFound(err: any): boolean {
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
    if (!message || !message.name) {
      return false;
    }
    if (message.name === "PIPELINE_NOT_FOUND_ERROR") {
      return true;
    }
    return false;
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
