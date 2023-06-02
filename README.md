# k8s-lab

This is a monorepo, containing all of the resources required to set up a
fully-featured Kubernetes cluster, complete with GitOps deployment workflows,
Istio service mesh and other goodies.

See the [docs](./docs/index.md) for more info.

## Requirements

- Docker
- `k3d` - To spin up a Kubernetes cluster in Docker
- `pnpm` - To manage the Pulumi project dependencies
- `jq` - This is used in a few places to parse data coming from Kubernetes
- An `/etc/hosts` entry for `k8s-lab.local`

  ```
  # file: /etc/hosts
  127.0.0.1   k8s-lab.local
  ```

## TODO:

### Project

- Add generated docs

- Host an NPM package registry (In Docker; outside of K8s) to emulate a polyrepo
  approach - eg. https://github.com/verdaccio/verdaccio

### Pulumi

- Import Pulumi secrets as secret everywhere `pulumiConfig.requireSecret(...)`

- Apply labels to each project (via. a transform?)

  ```ts
  const labels = {
    "app.kubernetes.io/tier": "infra",
    "app.kubernetes.io/name": name,
    "app.kubernetes.io/part-of": name,
    "app.kubernetes.io/managed-by": "pulumi",
  };
  ```
