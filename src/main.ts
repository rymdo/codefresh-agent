import * as winston from "winston";
import * as fs from "fs";
import * as glob from "glob";
import * as nunjucks from "nunjucks";
import * as yaml from "yaml";
import * as codefreshSDK from "codefresh-sdk";

import { Logger } from "./types";
import { Loader } from "./loader/loader";
import { SpecGenerator } from "./spec-generator/spec.generator";
import { Codefresh } from "./codefresh/codefresh";
import { Cli } from "./cli/cli";
import { SDK } from "./codefresh/types";

const createLogger = (namespace: string): Logger => {
  const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({ format: winston.format.json() }),
    ],
  });
  return {
    namespace,
    info: (message) => {
      logger.info(message);
    },
    warning: (message) => {
      logger.warning(message);
    },
    debug: (message) => {
      logger.debug(message);
    },
    error: (message) => {
      logger.error(message);
    },
  };
};

function createLoader(): Loader {
  return new Loader(fs, { find: glob.glob });
}

function createGenerator(): SpecGenerator {
  return new SpecGenerator(createLogger("spec.generator"), nunjucks, yaml);
}

async function createCodefresh(): Promise<Codefresh> {
  const sdk = new codefreshSDK.Codefresh();
  const config = await codefreshSDK.Config.fromCodefreshConfig();
  sdk.configure(config);
  const impl: SDK = {
    pipelines: {
      create: async (spec) => {
        return sdk.pipelines.create(spec);
      },
      get: async ({ name }) => {
        return sdk.pipelines.get({ name: `${name}` });
      },
      update: async ({ name }, spec) => {
        return sdk.pipelines.update({ name: `${name}` }, spec);
      },
    },
    projects: {
      get: async ({ name }) => {
        return sdk.projects.getByName({ name: `${name}` });
      },
      create: async (name) => {
        return sdk.projects.create({ projectName: `${name}` });
      },
    },
  };
  return new Codefresh(impl, createLogger("codefresh"));
}

function createCli(
  loader: Loader,
  generator: SpecGenerator,
  codefresh: Codefresh
): Cli {
  return new Cli(createLogger("cli"), loader, generator, codefresh);
}

async function main() {
  if (!process.env.CA_MANIFESTS_PATH) {
    throw new Error("Env CA_MANIFESTS_PATH missing");
  }
  if (!process.env.CA_TEMPLATES_PATH) {
    throw new Error("Env CA_TEMPLATES_PATH missing");
  }
  const loader = createLoader();
  const generator = createGenerator();
  const codefresh = await createCodefresh();
  const cli = createCli(loader, generator, codefresh);
  await cli.exec({
    manifestsPath: process.env.CA_MANIFESTS_PATH,
    templatesPath: process.env.CA_TEMPLATES_PATH,
  });
  process.exit();
}

process.on("SIGINT", () => {
  console.log("Caught interrupt signal");
  process.exit();
});

main().catch((err) => {
  console.log(err);
  process.exit();
});
