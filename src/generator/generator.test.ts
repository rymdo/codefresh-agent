import { Generator } from "./generator";
import {
  mockTest1,
  mockTemplates,
  mockManifestNoTemplates,
  mockManifestSingleTemplate,
} from "./mock/data.mock";
import { TemplateEngine, YamlEngine, ChecksumEngine } from "./types";

import * as YAML from "yaml";
import * as crypto from "crypto";

describe("generator", () => {
  const mockBasicSpecYaml = "metadata:\n";

  const mockEngine: TemplateEngine = { renderString: () => mockBasicSpecYaml };
  const mockYaml: YamlEngine = {
    parse: (str) => YAML.parse(str),
    stringify: (value) => YAML.stringify(value),
  };
  const mockChecksum: ChecksumEngine = {
    sha1: (value) => {
      const generator = crypto.createHash("sha1");
      generator.update(value);
      return generator.digest("hex");
    },
  };

  it("should be created", () => {
    expect(
      new Generator(mockEngine, mockYaml, mockChecksum, mockTest1.templates)
    ).toBeDefined();
  });

  describe("when created", () => {
    let testGenerator: Generator;
    beforeEach(() => {
      testGenerator = new Generator(
        mockEngine,
        mockYaml,
        mockChecksum,
        mockTemplates
      );
    });

    describe("with manifest with no templates", () => {
      it("should generate no specs", () => {
        const specs = testGenerator.generateSpecs(mockManifestNoTemplates);
        expect(Object.keys(specs).length).toEqual(0);
      });
    });

    describe("with manifest with single templates", () => {
      it("should generate single specs", () => {
        const specs = testGenerator.generateSpecs(mockManifestSingleTemplate);
        expect(Object.keys(specs).length).toEqual(1);
      });
    });

    describe("when using mockTest1", () => {
      it("should be called with correct test templates", () => {
        const expectedTemplates = Object.values(mockTest1.templates);
        const actualTemplates: string[] = [];
        mockEngine.renderString = (template, data) => {
          actualTemplates.push(template);
          return "";
        };
        try {
          testGenerator.generateSpecs({
            data: mockTest1.manifest.data,
            templates: mockTest1.manifest.templates,
          });
        } catch (err) {}

        expect(actualTemplates).toEqual(expectedTemplates);
      });

      it("should be called with correct test data", () => {
        const expectedData = mockTest1.manifest.data;
        let actualData = {};
        mockEngine.renderString = (template, data) => {
          actualData = data;
          return "";
        };
        try {
          testGenerator.generateSpecs({
            data: mockTest1.manifest.data,
            templates: mockTest1.manifest.templates,
          });
        } catch (err) {}
        expect(actualData).toEqual(expectedData);
      });

      it("should result in valid yaml", () => {
        let counter = 0;
        mockEngine.renderString = (template, data) => {
          return Object.values(mockTest1.resultSpecs)[counter++];
        };
        const result = testGenerator.generateSpecs({
          data: mockTest1.manifest.data,
          templates: mockTest1.manifest.templates,
        });
        for (const spec of Object.values(result)) {
          expect(YAML.parse(spec)).toBeTruthy();
        }
      });

      it("should add checksums to metadata/labels", () => {
        let counter = 0;
        mockEngine.renderString = (template, data) => {
          return Object.values(mockTest1.resultSpecs)[counter++];
        };
        const result = testGenerator.generateSpecs({
          data: mockTest1.manifest.data,
          templates: mockTest1.manifest.templates,
        });

        for (const spec of Object.values(result)) {
          const specParsed = YAML.parse(spec);
          expect(specParsed.metadata).toBeDefined();
          expect(specParsed.metadata.labels).toBeDefined();
          expect(specParsed.metadata.labels.ca_checksum_manifest).toBeDefined();
          expect(specParsed.metadata.labels.ca_checksum_template).toBeDefined();
        }
      });
    });
  });
});
