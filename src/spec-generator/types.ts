export interface TemplateEngine {
  renderString: (template: string, data: any) => string;
}

export interface YamlEngine {
  parse: (str: string) => any;
}

export type TemplateType = "JSON" | "YAML";

export interface TemplateInfo {
  name: string;
}

export interface Template extends TemplateInfo {
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
  templates: TemplateInfo[];
}
export interface Manifest {
  file: {
    content: ManifestContent;
    checksum: string;
  };
}
