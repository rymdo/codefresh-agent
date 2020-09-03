export interface SDK {
  pipelines: {
    create: (spec: Spec) => Promise<void>;
    get: (params: { name: string }) => Promise<any>;
    update: (params: { name: string }, spec: Spec) => Promise<void>;
  };
}

export type Spec = {
  version: "1.0";
  kind: "pipeline";
  metadata: {
    name: string;
    description?: string;
    project?: string;
    labels: {
      checksumManifest: string;
      checksumTemplate: string;
    };
  };
  spec: {
    triggers?: {
      type: string;
      repo: string;
      events: string[];
      branchRegex?: string;
      branchRegexInput?: string;
      modifiedFilesGlob?: string;
      provider: string;
      name: string;
      context: string;
    }[];
    contexts?: string[];
    variables?: {
      key: string;
      value: string;
    }[];
    specTemplate?: {
      location: string;
      context: string;
      repo: string;
      path: string;
      revision?: string;
    };
    stages?: string[];
    steps?: {
      [name: string]: {
        stage?: string;
        title?: string;
      } & {};
    };
  };
};
export type Specs = {
  [name: string]: Spec;
};
