import { SDK, Spec, SDKProject } from "./types";
import { Logger } from "../types";
import { TypeCheck } from "../tools/typecheck";

export const PROJECT_NOT_FOUND_ERROR = "PROJECT_NOT_FOUND_ERROR";
export const PROJECT_ALREADY_EXISTS = "PROJECT_ALREADY_EXISTS";
export const PROJECT_MALFORMED_ERROR = "PROJECT_MALFORMED_ERROR";

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

  async createProject(spec: Spec): Promise<void> {
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

  async createPipeline(spec: Spec): Promise<void> {
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

  async updatePipeline(spec: Spec): Promise<void> {
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
    this.logger.info(
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
        throw new Error(PROJECT_NOT_FOUND_ERROR);
      }
      throw err;
    }
    if (!this.isSDKProject(result)) {
      throw new Error(PROJECT_MALFORMED_ERROR);
    }
    return result;
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

  private isSDKProject(data: any): data is SDKProject {
    if (!data) {
      this.logDebugTypeError(this.isSDKProject.name, "data", "object{}", data);
      return false;
    }
    if (!TypeCheck.isString(data.id)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.id",
        "string",
        data.id
      );
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
    if (data.tags && !TypeCheck.isListOfStrings(data.tags)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.tags",
        "string[]",
        data.tags
      );
      return false;
    }
    if (!TypeCheck.isKeyValueObjectList(data.variables)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.variables",
        "{key: string; value: string}[]",
        data.variables
      );
      return false;
    }
    if (!TypeCheck.isBoolean(data.favorite)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.favorite",
        "boolean",
        data.favorite
      );
      return false;
    }
    if (!TypeCheck.isNumber(data.pipelinesNumber)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.pipelinesNumber",
        "number",
        data.pipelinesNumber
      );
      return false;
    }
    if (!TypeCheck.isString(data.updatedAt)) {
      this.logDebugTypeError(
        this.isSDKProject.name,
        "data.updatedAt",
        "number",
        data.updatedAt
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
    if (message.name === "PROJECT_NOT_FOUND_ERROR") {
      return true;
    }
    return false;
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
