import { Loader } from "../loader/loader";
import { SpecGenerator } from "../spec-generator/spec.generator";
import { Codefresh } from "../codefresh/codefresh";
import { Logger } from "../types";
import { Cli } from "./cli";
import { Template, Manifest } from "../spec-generator/types";
import { Spec } from "../codefresh/types";

const testManifest1: Manifest = {
  file: {
    checksum: "123",
    content: {
      data: {
        name: "test-manifest-1",
      },
      templates: [{ name: "dir0/test-template-1" }],
    },
  },
};
const testManifest2: Manifest = {
  file: {
    checksum: "456",
    content: {
      data: {
        name: "test-manifest-2",
      },
      templates: [
        { name: "dir0/test-template-1" },
        { name: "dir0/test-template-2" },
      ],
    },
  },
};

const testTemplate1: Template = {
  name: "dir0/test-template-1",
  file: {
    checksum: "879",
    type: "JSON",
    content: '{"name": "tmp-1"}',
  },
};
const testTemplate2: Template = {
  name: "dir0/test-template-2",
  file: {
    checksum: "769",
    type: "YAML",
    content: "data:\n",
  },
};

const testManifest1Specs: Spec[] = [
  ({ test_spec_1: "test-1" } as unknown) as Spec,
];
const testManifest2Specs: Spec[] = [
  ({ test_spec_2: "test-1" } as unknown) as Spec,
  ({ test_spec_2: "test-2" } as unknown) as Spec,
];
const testManifestSpecs: Spec[] = [];
testManifestSpecs.push(...testManifest1Specs);
testManifestSpecs.push(...testManifest2Specs);

describe("cli", () => {
  let mockLogger: Logger;
  let mockLoader: Loader;
  let mockGenerator: SpecGenerator;
  let mockCodefresh: Codefresh;
  let testCli: Cli;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockLoader = createMockLoader();
    mockGenerator = createMockGenerator();
    mockCodefresh = createMockCodefresh();
    testCli = new Cli(mockLogger, mockLoader, mockGenerator, mockCodefresh);
  });

  it("should load manifests with correct path", async () => {
    const expetedPath = "test/path/manifests";
    let actualPath = "";
    mockLoader.loadManifests = async (path) => {
      actualPath = path;
      return [];
    };
    await testCli.exec({ manifestsPath: expetedPath, templatesPath: "" });
    expect(actualPath).toEqual(expetedPath);
  });

  it("should load templates with correct path", async () => {
    const expetedPath = "test/path/templates";
    let actualPath = "";
    mockLoader.loadTemplates = async (path) => {
      actualPath = path;
      return [];
    };
    await testCli.exec({ manifestsPath: "", templatesPath: expetedPath });
    expect(actualPath).toEqual(expetedPath);
  });

  it("should generate spec with testManifest1", async () => {
    const actualUsedManifests: Manifest[] = [];
    mockGenerator.generateSpecs = (manifest, templates) => {
      actualUsedManifests.push(manifest);
      return [];
    };
    await testCli.exec({ manifestsPath: "", templatesPath: "" });
    expect(actualUsedManifests).toContainEqual(testManifest1);
  });

  it("should generate spec with testManifest2", async () => {
    const actualUsedManifests: Manifest[] = [];
    mockGenerator.generateSpecs = (manifest, templates) => {
      actualUsedManifests.push(manifest);
      return [];
    };
    await testCli.exec({ manifestsPath: "", templatesPath: "" });
    expect(actualUsedManifests).toContainEqual(testManifest2);
  });

  it("should generate spec with correct templates", async () => {
    let actualUsedTemplates: Template[] = [];
    mockGenerator.generateSpecs = (manifest, templates) => {
      actualUsedTemplates = templates;
      return [];
    };
    await testCli.exec({ manifestsPath: "", templatesPath: "" });
    expect(actualUsedTemplates).toEqual([testTemplate1, testTemplate2]);
  });

  it("should create codefresh pipelines with generated spec files", async () => {
    let actualUsedSpecs: Spec[] = [];
    mockCodefresh.createPipelines = async (specs) => {
      actualUsedSpecs.push(...specs);
    };
    await testCli.exec({ manifestsPath: "", templatesPath: "" });
    expect(actualUsedSpecs).toEqual(testManifestSpecs);
  });

  it("should update codefresh pipelines with generated spec files", async () => {
    let actualUsedSpecs: Spec[] = [];
    mockCodefresh.updatePipelines = async (specs) => {
      actualUsedSpecs.push(...specs);
    };
    await testCli.exec({ manifestsPath: "", templatesPath: "" });
    expect(actualUsedSpecs).toEqual(testManifestSpecs);
  });

  function createMockLogger(): Logger {
    return {
      namespace: "cli",
      info: () => {},
      debug: () => {},
      error: () => {},
      warning: () => {},
    };
  }

  function createMockLoader(): Loader {
    return ({
      loadManifests: async () => [testManifest1, testManifest2],
      loadTemplates: async () => [testTemplate1, testTemplate2],
    } as unknown) as Loader;
  }

  function createMockGenerator(): SpecGenerator {
    return ({
      generateSpecs: (manifest: Manifest) => {
        if (
          manifest.file.content.data.name ===
          testManifest1.file.content.data.name
        ) {
          return testManifest1Specs;
        }
        if (
          manifest.file.content.data.name ===
          testManifest2.file.content.data.name
        ) {
          return testManifest2Specs;
        }
        return [];
      },
    } as unknown) as SpecGenerator;
  }

  function createMockCodefresh(): Codefresh {
    return ({
      createPipelines: async () => {},
      updatePipelines: async () => {},
    } as unknown) as Codefresh;
  }
});
