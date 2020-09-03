import { Codefresh, PIPELINE_NOT_FOUND_ERROR } from "./codefresh";
import { SDK, Spec } from "./types";
import { Logger } from "../types";

const testP1: Spec = {
  version: "1.0",
  kind: "pipeline",
  metadata: {
    name: "test.p1",
    labels: {
      checksumManifest: "123",
      checksumTemplate: "123",
    },
  },
  spec: {
    steps: {
      test: { title: "test" },
    },
  },
};
const testP2: Spec = {
  version: "1.0",
  kind: "pipeline",
  metadata: {
    name: "test.p2",
    labels: {
      checksumManifest: "456",
      checksumTemplate: "456",
    },
  },
  spec: {
    steps: {
      test: { title: "test2" },
    },
  },
};
const testP1ModifiedManifest: Spec = {
  version: "1.0",
  kind: "pipeline",
  metadata: {
    name: "test.p1",
    labels: {
      checksumManifest: "9999",
      checksumTemplate: "123",
    },
  },
  spec: {
    steps: {
      test: { title: "test" },
    },
  },
};
const testP1ModifiedTemplate: Spec = {
  version: "1.0",
  kind: "pipeline",
  metadata: {
    name: "test.p1",
    labels: {
      checksumManifest: "123",
      checksumTemplate: "8888",
    },
  },
  spec: {
    steps: {
      test: { title: "test" },
    },
  },
};

const testAllPipelines = [testP1, testP2];

describe("codefresh", () => {
  let mockSdk: SDK;
  let mockLogger: Logger;
  let testCodefresh: Codefresh;
  beforeEach(() => {
    mockSdk = {
      pipelines: {
        create: async () => {},
        get: async () => {
          throw new Error("PIPELINE_NOT_FOUND_ERROR");
        },
        update: async () => {},
      },
    };
    mockLogger = {
      namespace: "codefresh",
      info: () => {},
      debug: () => {},
      error: () => {},
      warning: () => {},
    };
    testCodefresh = new Codefresh(mockSdk, mockLogger);
  });

  describe("on createPiplelines", () => {
    describe("with clean state codefresh state", () => {
      it("should create all test pipelines", async () => {
        const expectedSpecs: Spec[] = testAllPipelines;
        const actualSpecs: Spec[] = [];
        mockSdk.pipelines.create = async (spec) => {
          actualSpecs.push(spec);
        };
        await testCodefresh.createPipelines(expectedSpecs);
        expect(actualSpecs).toEqual(expectedSpecs);
      });
    });

    describe("with some pipelines already created", () => {
      beforeEach(() => {
        mockSdk.pipelines.get = async (spec) => {
          const existingPipelines: Spec[] = [testP1];
          for (const pipeline of existingPipelines) {
            if (pipeline.metadata.name.startsWith(spec.name)) {
              return pipeline;
            }
            throw new Error(PIPELINE_NOT_FOUND_ERROR);
          }
        };
      });

      it("it should create missing pipelines", async () => {
        const expectedSpecs: Spec[] = [testP2];
        const actualSpecs: Spec[] = [];
        mockSdk.pipelines.create = async (spec) => {
          actualSpecs.push(spec);
        };
        await testCodefresh.createPipelines(testAllPipelines);
        expect(actualSpecs).toEqual(expectedSpecs);
      });
    });
  });

  describe("with all pipelines already created", () => {
    beforeEach(() => {
      mockSdk.pipelines.get = async (spec) => {
        const existingPipelines: Spec[] = testAllPipelines;
        for (const pipeline of existingPipelines) {
          if (pipeline.metadata.name.startsWith(spec.name)) {
            return pipeline;
          }
        }
      };
    });

    it("it should create no pipelines", async () => {
      const expectedSpecs: Spec[] = [];
      const actualSpecs: Spec[] = [];
      mockSdk.pipelines.create = async (spec) => {
        actualSpecs.push(spec);
      };
      await testCodefresh.createPipelines(testAllPipelines);
      expect(actualSpecs).toEqual(expectedSpecs);
    });
  });

  describe("on updateSpecs", () => {
    describe("with clean state codefresh state", () => {
      it("should throw no pipelines found", async () => {
        await expect(
          testCodefresh.updatePipelines(testAllPipelines)
        ).rejects.toThrowError(PIPELINE_NOT_FOUND_ERROR);
      });
    });

    describe("with all pipelines created in codefresh", () => {
      beforeEach(() => {
        mockSdk.pipelines.get = async (spec) => {
          const existingPipelines: Spec[] = testAllPipelines;
          for (const pipeline of existingPipelines) {
            if (pipeline.metadata.name === spec.name) {
              return {
                ...pipeline,
              };
            }
          }
          return [];
        };
      });

      it("should update pipelines with changed manifest checksum", async () => {
        const expectedUpdatedSpecs: string[] = [testP1.metadata.name];
        const actualUpdatedSpecs: string[] = [];
        mockSdk.pipelines.update = async ({ name }, spec) => {
          actualUpdatedSpecs.push(name);
        };
        await testCodefresh.updatePipelines([testP1ModifiedManifest, testP2]);
        expect(actualUpdatedSpecs).toEqual(expectedUpdatedSpecs);
      });

      it("should update pipelines with changed template checksum", async () => {
        const expectedUpdatedSpecs: string[] = [testP1.metadata.name];
        const actualUpdatedSpecs: string[] = [];
        mockSdk.pipelines.update = async ({ name }, spec) => {
          actualUpdatedSpecs.push(name);
        };
        await testCodefresh.updatePipelines([testP1ModifiedTemplate, testP2]);
        expect(actualUpdatedSpecs).toEqual(expectedUpdatedSpecs);
      });
    });
  });
});
