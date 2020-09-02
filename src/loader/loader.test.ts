import { Loader } from "./loader";
import { FileSystem, Glob } from "./types";
import { Manifest, Template, ManifestContent } from "../spec-generator/types";

const testPath = "/test/path";
const testTemplateFilesYAML = {
  [`${testPath}/dir0/template0.yaml.njk`]: "dir0-template-0-data: {}\n",
  [`${testPath}/dir0/template1.yaml.njk`]: "dir0-template-1-data: {}\n",
  [`${testPath}/dir0/template2.yaml.njk`]: "dir0-template-2-data: {}\n",
};
const testTemplateFilesJSON = {
  [`${testPath}/dir1/template0.json.njk`]: '{"dir1-template-0-data":"1"}',
  [`${testPath}/dir1/template1.json.njk`]: '{"dir1-template-1-data":"2"}',
  [`${testPath}/dir1/template2.json.njk`]: '{"dir1-template-2-data":"3"}',
};
const testTemplateFiles = {
  ...testTemplateFilesYAML,
  ...testTemplateFilesJSON,
};
const testTemplateResult: Template[] = [
  {
    name: "dir0/template0",
    file: {
      checksum: "123",
      type: "YAML",
      content: "dir0-template-0-data: {}\n",
    },
  },
  {
    name: "dir0/template1",
    file: {
      checksum: "123",
      type: "YAML",
      content: "dir0-template-1-data: {}\n",
    },
  },
  {
    name: "dir0/template2",
    file: {
      checksum: "123",
      type: "YAML",
      content: "dir0-template-2-data: {}\n",
    },
  },
  {
    name: "dir1/template0",
    file: {
      checksum: "123",
      type: "JSON",
      content: '{"dir1-template-0-data":"1"}',
    },
  },
  {
    name: "dir1/template1",
    file: {
      checksum: "123",
      type: "JSON",
      content: '{"dir1-template-1-data":"2"}',
    },
  },
  {
    name: "dir1/template2",
    file: {
      checksum: "123",
      type: "JSON",
      content: '{"dir1-template-2-data":"3"}',
    },
  },
];

const testManifestFile0: ManifestContent = {
  data: {
    name: "test0",
  },
  templates: [{ name: "dir0/template0" }],
};
const testManifestFile1: ManifestContent = {
  data: {
    name: "test1",
  },
  templates: [{ name: "dir0/template1" }],
};
const testManifestFiles = {
  [`${testPath}/dir0/manifest.json`]: JSON.stringify(testManifestFile0),
  [`${testPath}/dir1/manifest.json`]: JSON.stringify(testManifestFile1),
};
const testManifestResult: Manifest[] = [
  {
    file: {
      checksum: "123",
      content: testManifestFile0,
    },
  },
  {
    file: {
      checksum: "123",
      content: testManifestFile1,
    },
  },
];

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
      expect(manifests.length).toEqual(testManifestResult.length);
    });

    it("should load all manifests with correct data", async () => {
      const actualManifests = await testLoader.loadManifests(testPath);
      expect(actualManifests).toEqual(testManifestResult);
    });

    it("should load manifests with correct key", async () => {
      const actualManifests = await testLoader.loadManifests(testPath);
      expect(actualManifests).toEqual(testManifestResult);
    });
  });

  describe("on loading templates", () => {
    beforeEach(() => {
      mockFileSystem = {
        readFileSync: (file) => testTemplateFiles[file],
      };
      mockGlob = {
        find: (pattern, callback) => {
          if (pattern.includes("json.njk")) {
            callback(undefined, Object.keys(testTemplateFilesJSON));
          } else {
            callback(undefined, Object.keys(testTemplateFilesYAML));
          }
        },
      };
      testLoader = new Loader(mockFileSystem, mockGlob);
    });

    it("should look with correct glob patterns", async () => {
      let expectedPatterns: string[] = [
        `${testPath}/**/*.json.njk`,
        `${testPath}/**/*.yaml.njk`,
      ];
      let actualPatterns: string[] = [];
      mockGlob.find = (pattern, callback) => {
        actualPatterns.push(pattern);
        callback(undefined, []);
      };
      await testLoader.loadTemplates(testPath);
      expect(actualPatterns).toEqual(expectedPatterns);
    });

    it("should load all templates", async () => {
      const templates = await testLoader.loadTemplates(testPath);
      expect(templates.length).toEqual(testTemplateResult.length);
    });

    xit("should load all templates with correct data", async () => {
      const actualTemplates = await testLoader.loadTemplates(testPath);
      expect(actualTemplates).toEqual(testTemplateResult);
    });
    xit("should load templates with correct key", async () => {
      const actualTemplates = await testLoader.loadTemplates(testPath);
      expect(actualTemplates).toEqual(testTemplateResult);
    });
  });
});
