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

  private isEmptySpecList(result: Spec[]): boolean {
    return result.length === 0;
  }

  private isSpecList(data: any): data is Spec[] {
    if (!data) {
      return false;
    }
    if (!Array.isArray(data)) {
      return false;
    }
    for (const entry of data) {
      if (!this.isSpec(entry)) {
        return false;
      }
    }
    return true;
  }

  private isSpec(data: any): data is Spec {
    if (!data) {
      return false;
    }
    if (!data.version || !(typeof data.version === "string")) {
      return false;
    }
    if (!data.kind || !(typeof data.kind === "string")) {
      return false;
    }
    if (
      !data.metadata ||
      !data.metadata.name ||
      !(typeof data.metadata.name === "string")
    ) {
      return false;
    }
    return true;
  }
}
