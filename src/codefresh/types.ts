export type SDKProject = {
  projectName: string;
} & { [name: string]: any };

export type SDKPipeline = {
  metadata: {
    name: string;
    project: string;
    labels?: {
      checksumManifest?: string;
      checksumTemplate?: string;
    };
  } & { [name: string]: any };
} & { [name: string]: any };

export interface SDK {
  projects: {
    get: (params: { name: string }) => Promise<SDKProject>;
    create: (name: string) => Promise<void>;
  };
  pipelines: {
    create: (spec: SDKPipeline) => Promise<void>;
    get: (params: { name: string }) => Promise<SDKPipeline>;
    update: (params: { name: string }, spec: SDKPipeline) => Promise<void>;
  };
}
