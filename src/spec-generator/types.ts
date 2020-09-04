export interface TemplateEngine {
  renderString: (template: string, data: any) => string;
}

export interface YamlEngine {
  parse: (str: string) => any;
}

export type TemplateType = "JSON" | "YAML";
export interface Template {
  name: string;
  file: {
    type: TemplateType;
    content: string;
    checksum: string;
  };
}

export interface ManifestContent {
  data: {
    [key: string]: any;
  };
  templates: { name: string; alias: string }[];
}
export interface Manifest {
  file: {
    content: ManifestContent;
    checksum: string;
  };
}

export type Spec = {
  metadata: {
    name: string;
    project: string;
    labels: {
      checksumManifest: string;
      checksumTemplate: string;
    };
  } & { [name: string]: any };
} & { [name: string]: any };
