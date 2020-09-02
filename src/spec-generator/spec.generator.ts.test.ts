import { SpecGenerator } from "./spec.generator";
import { Logger } from "../types";
import { Manifest, TemplateEngine, Template, YamlEngine } from "./types";
import { Spec } from "../codefresh/types";

import * as YAML from "yaml";

const testTemplate1: Template = {
  name: "template.test1",
  file: {
    type: "JSON",
    checksum: "123",
    content: "TEMPLATE_DATA_1_JSON",
  },
};
const testTemplate2: Template = {
  name: "template.test2",
  file: {
    type: "JSON",
    checksum: "567",
    content: "TEMPLATE_DATA_2_JSON",
  },
};
const testTemplate3: Template = {
  name: "template.test3",
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
        },
      ],
    },
  },
};
const testSpec1: Spec = {
  metadata: {
    labels: {
      checksumManifest: testManifest1.file.checksum,
      checksumTemplate: testTemplate1.file.checksum,
    },
  },
} as Spec;

describe("spec.generator", () => {
  let mockLogger: Logger;
  let mockTemplater: TemplateEngine;
  let mockYaml: YamlEngine;
  let testGenerator: SpecGenerator;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockTemplater = createMockTemplater();
    mockYaml = createMockYaml();
    testGenerator = new SpecGenerator(mockLogger, mockTemplater, mockYaml, [
      testTemplate1,
      testTemplate2,
    ]);
  });

  describe("on generateSpec", () => {
    describe("given json template", () => {
      it("should use templater with correct template", () => {
        let actualTemplate = "";
        mockTemplater.renderString = (template) => {
          actualTemplate = template;
          return "{}";
        };
        testGenerator.generateSpec(testManifest1, testTemplate1);
        expect(actualTemplate).toEqual(testTemplate1.file.content);
      });

      it("should use templater with correct manifest data", () => {
        let actualData = "";
        mockTemplater.renderString = (template, data) => {
          actualData = data;
          return "{}";
        };
        testGenerator.generateSpec(testManifest1, testTemplate1);
        expect(actualData).toEqual(testManifest1.file.content.data);
      });
    });

    describe("given yaml template", () => {
      it("should use templater with correct template ", () => {
        let actualTemplate = "";
        mockTemplater.renderString = (template) => {
          actualTemplate = template;
          return "";
        };
        testGenerator.generateSpec(testManifest1, testTemplate3);
        expect(actualTemplate).toEqual(testTemplate3.file.content);
      });

      it("should use templater with correct manifest data ", () => {
        let actualData = "";
        mockTemplater.renderString = (template, data) => {
          actualData = data;
          return "";
        };
        testGenerator.generateSpec(testManifest1, testTemplate3);
        expect(actualData).toEqual(testManifest1.file.content.data);
      });
    });

    it("should have manifest checksum label in result", () => {
      const result = testGenerator.generateSpec(testManifest1, testTemplate1);
      expect(result.metadata.labels.checksumManifest).toEqual(
        testManifest1.file.checksum
      );
    });

    it("should have template checksum label in result", () => {
      const result = testGenerator.generateSpec(testManifest1, testTemplate1);
      expect(result.metadata.labels.checksumTemplate).toEqual(
        testTemplate1.file.checksum
      );
    });
  });

  describe("on generateSpecs", () => {
    it("should generate 1 spec per template", () => {
      const specs = testGenerator.generateSpecs(testManifest1);
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
    return { renderString: () => "{}" };
  }

  function createMockYaml(): YamlEngine {
    return {
      parse: (str) => YAML.parse(str),
    };
  }
});
