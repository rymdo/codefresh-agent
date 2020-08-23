export interface TemplateEngine {
  renderString: (template: string, data: any) => string;
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

export type Spec = string;
export type Specs = {
  [name: string]: Spec;
};
