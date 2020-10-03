# codefresh-template-agent

**Create and maintain your Codefresh pipelines with the power of templating!**

## Running (Local)

To run the app, do the following:

Note: This requires that you have the Codefresh CLI and you are logged in with an API key.
https://codefresh-io.github.io/cli/

1. Checkout the repo

```
> git clone https://github.com/rymdo/codefresh-template-agent.git
```

2. Initialize the project

```
> yarn
```

3. Build and run the app

```
> CTA_MANIFESTS_PATH=<PATH TO YOUR MANIFESTS DIRECTORY> \
  CTA_TEMPLATES_PATH=<PATH TO YOUR TEMPLATES DIRECTORY> \
  CTA_LOG_LEVEL=info \
  yarn start
```

## Running (CI)

To run the agent automatically in your ci whenever you change your manifests or templates (gitops), you can use the following spec-file. This assumes you have your manifests/templates in a git repo and have setup access for codefresh. (This example uses bitbucket as provider.)

Tags to replace:

- \<CREDENTIAL_CONTEXT\> : Context which has **CODEFRESH_API_KEY** stored
- \<REPO\> : Git repo which contains your manifest/template files
- \<MANIFEST_PATH\> : Path to your manifests in the repo
- \<TEMPLATE_PATH\> : Path to your templates in the repo

```json
{
  "version": "1.0",
  "kind": "pipeline",
  "metadata": {
    "name": "ci/cta",
    "project": "ci"
  },
  "spec": {
    "contexts": ["<CREDENTIAL_CONTEXT>"],
    "triggers": [
      {
        "type": "git",
        "repo": "<REPO>",
        "events": ["push"],
        "branchRegex": "/.*/gi",
        "branchRegexInput": "regex",
        "provider": "bitbucket",
        "name": "file change",
        "context": "bitbucket"
      }
    ],
    "stages": ["clone", "sync"],
    "steps": {
      "clone": {
        "stage": "clone",
        "type": "git-clone",
        "title": "Cloning Repository",
        "repo": "<REPO>",
        "revision": "master",
        "git": "bitbucket"
      },
      "sync": {
        "stage": "sync",
        "type": "freestyle",
        "title": "Sync Pipelines",
        "image": "rymdo/codefresh-template-agent:master",
        "working_directory": "${{clone}}",
        "environment": [
          "CTA_MANIFESTS_PATH=<MANIFEST_PATH>",
          "CTA_TEMPLATES_PATH=<TEMPLATE_PATH>",
          "CTA_LOG_LEVEL=info"
        ],
        "commands": [
          "yarn global add codefresh",
          "codefresh auth create-context --api-key ${CODEFRESH_API_KEY}",
          "node /app/main.js"
        ]
      }
    }
  }
}
```
