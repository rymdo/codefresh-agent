export interface TemplateEngine {
  renderString: (template: string, data: any) => string;
}

export interface YamlEngine {
  parse: (str: string) => any;
  stringify: (value: any) => string;
}

export interface ChecksumEngine {
  sha1: (value: string) => string;
}

export type Template = string;
export type Templates = {
  [name: string]: Template;
};

export type Manifest = {
  data: {
    [key: string]: any;
  };
  templates: string[];
};
export type Manifests = {
  [name: string]: Manifest;
};

export type Spec = string;
export type Specs = {
  [name: string]: Spec;
};
