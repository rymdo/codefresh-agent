import { Generator } from "./generator";
import {
  mockTemplateBase,
  mockTest1,
  mockTemplates,
  mockManifestNoTemplates,
  mockManifestSingleTemplate,
} from "./mock/data.mock";
import { TemplateEngine } from "./types";

describe("generator", () => {
  const mockEngine: TemplateEngine = { renderString: () => "" };

  it("should be created", () => {
    expect(new Generator(mockEngine, mockTest1.templates)).toBeDefined();
  });

  describe("when created", () => {
    let testGenerator: Generator;
    beforeEach(() => {
      testGenerator = new Generator(mockEngine, mockTemplates);
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
        testGenerator.generateSpecs({
          data: mockTest1.manifest.data,
          templates: mockTest1.manifest.templates,
        });
        expect(actualTemplates).toEqual(expectedTemplates);
      });

      it("should be called with correct test data", () => {
        const expectedData = mockTest1.manifest.data;
        let actualData = {};
        mockEngine.renderString = (template, data) => {
          actualData = data;
          return "";
        };
        testGenerator.generateSpecs({
          data: mockTest1.manifest.data,
          templates: mockTest1.manifest.templates,
        });
        expect(actualData).toEqual(expectedData);
      });
      it("should result in correct output", () => {
        let counter = 0;
        mockEngine.renderString = (template, data) => {
          return Object.values(mockTest1.resultSpecs)[counter++];
        };
        const result = testGenerator.generateSpecs({
          data: mockTest1.manifest.data,
          templates: mockTest1.manifest.templates,
        });
        expect(result).toEqual(mockTest1.resultSpecs);
      });
    });
  });
});
