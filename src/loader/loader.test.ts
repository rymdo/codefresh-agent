import { Loader } from "./loader";
import { FileSystem, Glob } from "./types";

const testPath = "/test/path";
const testTemplateFiles = {
  [`${testPath}/dir0/template0.njk`]: "dir0-template-0-data",
  [`${testPath}/dir0/template1.njk`]: "dir0-template-1-data",
  [`${testPath}/dir0/template2.njk`]: "dir0-template-2-data",
  [`${testPath}/dir1/template0.njk`]: "dir1-template-0-data",
  [`${testPath}/dir1/template1.njk`]: "dir1-template-1-data",
  [`${testPath}/dir1/template2.njk`]: "dir1-template-2-data",
};
const testResult = {
  [`dir0/template0`]: "dir0-template-0-data",
  [`dir0/template1`]: "dir0-template-1-data",
  [`dir0/template2`]: "dir0-template-2-data",
  [`dir1/template0`]: "dir1-template-0-data",
  [`dir1/template1`]: "dir1-template-1-data",
  [`dir1/template2`]: "dir1-template-2-data",
};

describe("loader", () => {
  let mockFileSystem: FileSystem;
  let mockGlob: Glob;

  beforeEach(() => {
    mockFileSystem = {
      readFileSync: (file) => testTemplateFiles[file],
    };
    mockGlob = {
      find: (pattern, callback) => {
        callback(undefined, Object.keys(testTemplateFiles));
      },
    };
  });

  it("should be created", () => {
    expect(new Loader(mockFileSystem, mockGlob)).toBeDefined();
  });

  describe("when created", () => {
    let testLoader: Loader;

    beforeEach(() => {
      testLoader = new Loader(mockFileSystem, mockGlob);
    });

    describe("when looking for templates", () => {
      it("should look with correct glob pattern", async () => {
        let expectedPattern = `${testPath}/**/*.njk`;
        let actualPattern = "";
        mockGlob.find = (pattern, callback) => {
          actualPattern = pattern;
          callback(undefined, []);
        };
        await testLoader.loadTemplates(testPath);
        expect(actualPattern).toEqual(expectedPattern);
      });
    });

    describe("when loading templates", () => {
      it("should load all templates", async () => {
        const templates = await testLoader.loadTemplates(testPath);
        expect(Object.keys(templates).length).toEqual(
          Object.keys(testTemplateFiles).length
        );
      });
      it("should load all templates with correct data", async () => {
        const actualTemplates = await testLoader.loadTemplates(testPath);
        expect(Object.values(actualTemplates)).toEqual(
          Object.values(testResult)
        );
      });
      it("should load templates with correct key", async () => {
        const actualTemplates = await testLoader.loadTemplates(testPath);
        expect(Object.keys(actualTemplates)).toEqual(Object.keys(testResult));
      });
    });

    describe("with no templates", () => {
      it("should return no templates", () => {
        expect(
          Object.values(testLoader.loadTemplates(testPath)).length
        ).toEqual(0);
      });
    });
  });
});
