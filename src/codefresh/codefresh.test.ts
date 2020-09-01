import { Codefresh } from "./codefresh";
import { SDK, Specs, Spec } from "./types";
import { pipeline } from "stream";
import { Logger } from "../types";

const testP1: Spec = {
  version: "1.0",
  kind: "pipeline",
  metadata: {
    name: "test.p1",
    labels: {
      caChecksumManifest: "123",
      caChecksumTemplate: "123",
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
      caChecksumManifest: "456",
      caChecksumTemplate: "456",
    },
  },
  spec: {
    steps: {
      test: { title: "test2" },
    },
  },
};

describe("codefresh", () => {
  let mockSdk: SDK;
  let mockLogger: Logger;
  let testCodefresh: Codefresh;
  beforeEach(() => {
    mockSdk = {
      pipelines: {
        create: async () => {},
        get: async () => [],
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
      beforeEach(() => {
        mockSdk.pipelines.get = async () => [];
      });
      it("should create all test pipelines", async () => {
        const expectedSpecs: Spec[] = [testP1, testP2];
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
          }
        };
      });

      it("it should create missing pipelines", async () => {
        const expectedSpecs: Spec[] = [testP2];
        const actualSpecs: Spec[] = [];
        mockSdk.pipelines.create = async (spec) => {
          actualSpecs.push(spec);
        };
        await testCodefresh.createPipelines([testP1, testP2]);
        expect(actualSpecs).toEqual(expectedSpecs);
      });
    });
  });

  describe("with all pipelines already created", () => {
    beforeEach(() => {
      mockSdk.pipelines.get = async (spec) => {
        const existingPipelines: Spec[] = [testP1, testP2];
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
      await testCodefresh.createPipelines([testP1, testP2]);
      expect(actualSpecs).toEqual(expectedSpecs);
    });
  });
});
