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
const testTemplateResult = {
  [`dir0/template0`]: "dir0-template-0-data",
  [`dir0/template1`]: "dir0-template-1-data",
  [`dir0/template2`]: "dir0-template-2-data",
  [`dir1/template0`]: "dir1-template-0-data",
  [`dir1/template1`]: "dir1-template-1-data",
  [`dir1/template2`]: "dir1-template-2-data",
};

const testManifestFile0 = {
  data: {
    name: "test0",
  },
  templates: ["dir0/template0"],
};
const testManifestFile1 = {
  data: {
    name: "test1",
  },
  templates: ["dir1/template1"],
};
const testManifestFiles = {
  [`${testPath}/dir0/manifest.json`]: JSON.stringify(testManifestFile0),
  [`${testPath}/dir1/manifest.json`]: JSON.stringify(testManifestFile1),
};
const testManifestResult = {
  [`dir0/manifest`]: testManifestFile0,
  [`dir1/manifest`]: testManifestFile1,
};

describe("loader", () => {
  let testLoader: Loader;
  let mockFileSystem: FileSystem;
  let mockGlob: Glob;

  describe("on loading manifests", () => {
    beforeEach(() => {
      mockFileSystem = {
        readFileSync: (file) => testManifestFiles[file],
      };
      mockGlob = {
        find: (pattern, callback) => {
          callback(undefined, Object.keys(testManifestFiles));
        },
      };
      testLoader = new Loader(mockFileSystem, mockGlob);
    });

    it("should look with correct glob pattern", async () => {
      let expectedPattern = `${testPath}/**/manifest.json`;
      let actualPattern = "";
      mockGlob.find = (pattern, callback) => {
        actualPattern = pattern;
        callback(undefined, []);
      };
      await testLoader.loadManifests(testPath);
      expect(actualPattern).toEqual(expectedPattern);
    });

    it("should load all manifests", async () => {
      const manifests = await testLoader.loadManifests(testPath);
      expect(Object.keys(manifests).length).toEqual(
        Object.keys(testManifestFiles).length
      );
    });

    it("should load all manifests with correct data", async () => {
      const actualManifests = await testLoader.loadManifests(testPath);
      expect(Object.values(actualManifests)).toEqual(
        Object.values(testManifestResult)
      );
    });
    it("should load manifests with correct key", async () => {
      const actualManifests = await testLoader.loadManifests(testPath);
      expect(Object.keys(actualManifests)).toEqual(
        Object.keys(testManifestResult)
      );
    });
  });

  describe("on loading templates", () => {
    beforeEach(() => {
      mockFileSystem = {
        readFileSync: (file) => testTemplateFiles[file],
      };
      mockGlob = {
        find: (pattern, callback) => {
          callback(undefined, Object.keys(testTemplateFiles));
        },
      };
      testLoader = new Loader(mockFileSystem, mockGlob);
    });

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

    it("should load all templates", async () => {
      const templates = await testLoader.loadTemplates(testPath);
      expect(Object.keys(templates).length).toEqual(
        Object.keys(testTemplateFiles).length
      );
    });
    it("should load all templates with correct data", async () => {
      const actualTemplates = await testLoader.loadTemplates(testPath);
      expect(Object.values(actualTemplates)).toEqual(
        Object.values(testTemplateResult)
      );
    });
    it("should load templates with correct key", async () => {
      const actualTemplates = await testLoader.loadTemplates(testPath);
      expect(Object.keys(actualTemplates)).toEqual(
        Object.keys(testTemplateResult)
      );
    });
  });
});
