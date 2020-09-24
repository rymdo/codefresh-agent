import {
  Codefresh,
  PIPELINE_NOT_FOUND_ERROR,
  PROJECT_ALREADY_EXISTS,
} from "./codefresh";
import { SDK, SDKProject, SDKPipeline } from "./types";
import { Logger } from "../types";

const testP1: SDKPipeline = {
  metadata: {
    name: "project-1/test.p1",
    project: "project-1",
    description: JSON.stringify({
      checksumManifest: "123",
      checksumTemplate: "123",
    }),
  },
};
const testP2: SDKPipeline = {
  metadata: {
    name: "project-2/test.p2",
    project: "project-2",
    description: JSON.stringify({
      checksumManifest: "456",
      checksumTemplate: "456",
    }),
  },
};
const testP1ModifiedManifest: SDKPipeline = {
  metadata: {
    name: "project-1/test.p1",
    project: "project-1",
    description: JSON.stringify({
      checksumManifest: "9999",
      checksumTemplate: "123",
    }),
  },
};
const testP1ModifiedTemplate: SDKPipeline = {
  metadata: {
    name: "project-1/test.p1",
    project: "project-1",
    description: JSON.stringify({
      checksumManifest: "123",
      checksumTemplate: "8888",
    }),
  },
};

const SDKProjectNotFoundError = JSON.stringify(
  JSON.stringify({
    name: "INTERNAL_SERVER_ERROR",
    code: "1001",
    message: "404 - {}",
  })
);

const SDKPipelineNotFoundError = JSON.stringify(
  JSON.stringify({ name: "PIPELINE_NOT_FOUND_ERROR" })
);

describe("codefresh", () => {
  let mockSdk: SDK;
  let mockLogger: Logger;
  let testCodefresh: Codefresh;
  beforeEach(() => {
    mockSdk = {
      projects: {
        get: async () => {
          throw new Error(SDKProjectNotFoundError);
        },
        create: async (name) => {
          throw new Error(PROJECT_ALREADY_EXISTS);
        },
      },
      pipelines: {
        create: async () => {},
        get: async () => {
          throw new Error(SDKPipelineNotFoundError);
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

  describe("on createProject", () => {
    describe("when project exist", () => {
      it("should not attempt to create project", async () => {
        let called = false;
        mockSdk.projects.get = async (): Promise<SDKProject> => {
          return {
            projectName: "test",
          };
        };
        mockSdk.projects.create = async (name: string) => {
          called = true;
        };
        await testCodefresh.createProject(testP1);
        expect(called).toBeFalsy();
      });
    });

    describe("when project does not exist", () => {
      it("should create project with correct name", async () => {
        const expectedName = testP1.metadata.project;
        let actualName = "";
        mockSdk.projects.create = async (name: string) => {
          actualName = name;
        };
        await testCodefresh.createProject(testP1);
        expect(actualName).toEqual(expectedName);
      });
    });
  });

  describe("on createPipeline", () => {
    describe("with pipeline not created", () => {
      it("should create pipeline", async () => {
        const expectedSDKPipeline: SDKPipeline = testP1;
        let actualSDKPipeline;
        mockSdk.pipelines.create = async (spec) => {
          actualSDKPipeline = spec;
        };
        await testCodefresh.createPipeline(expectedSDKPipeline);
        expect(actualSDKPipeline).toEqual(expectedSDKPipeline);
      });
    });
    describe("with pipeline created", () => {
      it("should not create pipeline", async () => {
        mockSdk.pipelines.get = async () => testP1;
        let called = false;
        mockSdk.pipelines.create = async () => {
          called = true;
        };
        await testCodefresh.createPipeline(testP1);
        expect(called).toBeFalsy();
      });
    });
  });

  describe("on updatePipeline", () => {
    describe("with pipeline not created", () => {
      it("should throw pipeline not found", async () => {
        await expect(testCodefresh.updatePipeline(testP1)).rejects.toThrowError(
          PIPELINE_NOT_FOUND_ERROR
        );
      });
    });
    describe("with pipeline created", () => {
      it("should not update pipeline with no checksum changes", async () => {
        mockSdk.pipelines.get = async () => testP1;
        let called = false;
        mockSdk.pipelines.update = async () => {
          called = true;
        };
        await testCodefresh.updatePipeline(testP1);
        expect(called).toBeFalsy();
      });
      it("should update pipeline with changed manifest checksum", async () => {
        mockSdk.pipelines.get = async () => testP1;
        let called = false;
        mockSdk.pipelines.update = async () => {
          called = true;
        };
        await testCodefresh.updatePipeline(testP1ModifiedManifest);
        expect(called).toBeTruthy();
      });
      it("should update pipeline with changed template checksum", async () => {
        mockSdk.pipelines.get = async () => testP1;
        let called = false;
        mockSdk.pipelines.update = async () => {
          called = true;
        };
        await testCodefresh.updatePipeline(testP1ModifiedTemplate);
        expect(called).toBeTruthy();
      });
    });
  });
});
