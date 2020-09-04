import { SpecGenerator } from "./spec.generator";
import { Logger } from "../types";
import { Manifest, TemplateEngine, Template, YamlEngine, Spec } from "./types";

import * as YAML from "yaml";

const testTemplate1: Template = {
  name: "dir0/test1",
  file: {
    type: "JSON",
    checksum: "123",
    content: "TEMPLATE_DATA_1_JSON",
  },
};
const testTemplate2: Template = {
  name: "dir1/test2",
  file: {
    type: "JSON",
    checksum: "567",
    content: "TEMPLATE_DATA_2_JSON",
  },
};
const testTemplate3: Template = {
  name: "dir2/test3",
  file: {
    type: "YAML",
    checksum: "981",
    content: "TEMPLATE_DATA_3_YAML",
  },
};
const testManifest1: Manifest = {
  file: {
    checksum: "123",
    content: {
      data: {
        name: "app-hello-wold",
        project: "service-hello",
      },
      templates: [
        {
          name: testTemplate1.name,
          alias: "build",
        },
        {
          name: testTemplate1.name,
          alias: "test",
        },
      ],
    },
  },
};

describe("spec.generator", () => {
  let mockLogger: Logger;
  let mockTemplater: TemplateEngine;
  let mockYaml: YamlEngine;
  let testGenerator: SpecGenerator;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockTemplater = createMockTemplater();
    mockYaml = createMockYaml();
    testGenerator = new SpecGenerator(mockLogger, mockTemplater, mockYaml);
  });

  describe("on generateSpec", () => {
    describe("given json template", () => {
      it("should use templater with correct template", () => {
        let actualTemplate = "";
        mockTemplater.renderString = (template) => {
          actualTemplate = template;
          return JSON.stringify({
            metadata: {
              name: "test-project-json/test-name-json",
              project: "test-project-json",
            },
          });
        };
        testGenerator.generateSpec(testManifest1, testTemplate1, "test");
        expect(actualTemplate).toEqual(testTemplate1.file.content);
      });

      it("should use templater with correct manifest data", () => {
        let actualData = "";
        mockTemplater.renderString = (template, data) => {
          actualData = data;
          return JSON.stringify({
            metadata: {
              name: "test-project-json/test-name-json",
              project: "test-project-json",
            },
          });
        };
        testGenerator.generateSpec(testManifest1, testTemplate1, "test");
        expect(actualData).toEqual(testManifest1.file.content.data);
      });
    });

    describe("given yaml template", () => {
      it("should use templater with correct template ", () => {
        let actualTemplate = "";
        mockTemplater.renderString = (template) => {
          actualTemplate = template;
          return YAML.stringify({
            metadata: {
              name: "test-project-yaml/test-name-yaml",
              project: "test-project-yaml",
            },
          });
        };
        testGenerator.generateSpec(testManifest1, testTemplate3, "test");
        expect(actualTemplate).toEqual(testTemplate3.file.content);
      });

      it("should use templater with correct manifest data ", () => {
        let actualData = "";
        mockTemplater.renderString = (template, data) => {
          actualData = data;
          return YAML.stringify({
            metadata: {
              name: "test-project-yaml/test-name-yaml",
              project: "test-project-yaml",
            },
          });
        };
        testGenerator.generateSpec(testManifest1, testTemplate3, "test");
        expect(actualData).toEqual(testManifest1.file.content.data);
      });
    });

    it("should have manifest checksum label in result", () => {
      const result = testGenerator.generateSpec(
        testManifest1,
        testTemplate1,
        "test"
      );
      expect(result.metadata.labels.checksumManifest).toEqual(
        testManifest1.file.checksum
      );
    });

    it("should have template checksum label in result", () => {
      const result = testGenerator.generateSpec(
        testManifest1,
        testTemplate1,
        "test"
      );
      expect(result.metadata.labels.checksumTemplate).toEqual(
        testTemplate1.file.checksum
      );
    });

    it("should have correct metadata name", () => {
      const result = testGenerator.generateSpec(
        testManifest1,
        {
          ...testTemplate1,
        },
        "test"
      );
      expect(result.metadata.name).toEqual(`test-project/test-name-test`);
    });
  });

  describe("on generateSpecs", () => {
    it("should generate 1 spec per template", () => {
      const specs = testGenerator.generateSpecs(testManifest1, [
        testTemplate1,
        testTemplate2,
      ]);
      expect(specs.length).toEqual(testManifest1.file.content.templates.length);
    });
  });

  function createMockLogger(): Logger {
    return {
      namespace: "spec.generator",
      info: () => {},
      debug: () => {},
      error: () => {},
      warning: () => {},
    };
  }

  function createMockTemplater(): TemplateEngine {
    return {
      renderString: () =>
        JSON.stringify({
          metadata: {
            name: "test-project/test-name",
            project: "test-project",
          },
        }),
    };
  }

  function createMockYaml(): YamlEngine {
    return {
      parse: (str) => YAML.parse(str),
    };
  }
});
