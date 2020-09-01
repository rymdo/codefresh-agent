import { Templates, Manifest, Specs } from "./../types";

export interface MockTestSetup {
  manifest: Manifest;
  templates: Templates;
  resultSpecs: Specs;
}

const mockTest1Templates = {
  "test/base": `version: "1.0"
kind: pipeline
metadata:
  name: {{project}}/{{name}}
  description: "{{name}}"
  deprecate: {}
  project: {{project}}
  labels:
    name: {{name}}
spec:
  contexts: []
  stages: []
  steps: {}
`,
};
const mockTest1ResultSpecs = {
  "test/base": `version: "1.0"
kind: pipeline
metadata:
  name: test-1-project/test-1-name
  description: test-1-name
  deprecate: {}
  project: test-1-project
  labels:
    name: test-1-name
    ca_checksum_manifest: ""
    ca_checksum_template: ""
spec:
  contexts: []
  stages: []
  steps: {}
`,
};
export const mockTest1: MockTestSetup = {
  manifest: {
    data: {
      name: "test-1-name",
      project: "test-1-project",
    },
    templates: ["test/base"],
  },
  templates: mockTest1Templates,
  resultSpecs: mockTest1ResultSpecs,
};

export const mockTemplateBase = {
  name: "test/base",
  template: `version: "1.0"
kind: pipeline
metadata:
  name: {{project}}/{{name}}
  description: "{{name}}"
  deprecate: {}
  project: {{project}}
  labels:
    name: {{name}}
spec:
  contexts: []
  stages: []
  steps: {}
`,
};

export const mockTemplateNames: string[] = [mockTemplateBase.name];
export const mockTemplateData: string[] = [mockTemplateBase.template];

export const mockTemplates: Templates = {};
mockTemplateNames.forEach((name, index) => {
  mockTemplates[`${name}`] = mockTemplateData[index];
});

export const mockManifestNoTemplates: Manifest = {
  data: {},
  templates: [],
};

export const mockManifestSingleTemplate: Manifest = {
  data: {},
  templates: [mockTemplateNames[0]],
};
