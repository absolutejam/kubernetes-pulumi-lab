# Sealed Secrets


## Setup

- Pull dependencies

  ```bash
  pnpm install
  ```


## Stack config

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```