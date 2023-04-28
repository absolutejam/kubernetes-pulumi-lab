# Kubernetes lab

Resources to spin up test applications into a Kubernetes cluster.

## Cluster spinup

```bash
export K3D_CLUSTER=local-lab
export K8S_CLUSTER=k3d-${K3D_CLUSTER}
export VOLUME=/tmp/${K8S_CLUSTER}

mkdir -p ${VOLUME} 2> /dev/null

k3d cluster create ${K3D_CLUSTER} \
  --volume ${VOLUME}:${VOLUME} \
  --servers 3 \
  -p "8090:80@loadbalancer"
```

## Usage

- State is stored locally since this is just for a lab

  ```bash
  pulumi login file://$(PWD)/.state
  export PULUMI_CONFIG_PASSPHRASE='waffle123!'
  ```

## Generating Traefik CRDs

By default, `k3d` ships with Traefik installed in the cluster.

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD definitions from the cluster:

  ```bash
  OUT=./src/crds/source
  kubectl get crd ingressroutes.traefik.containo.us -o yaml > ${OUT}/ingressroutes.yaml
  kubectl get crd middlewares.traefik.containo.us -o yaml   > ${OUT}/middlewares.yaml
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/traefik \
      ${OUT}/ingressroutes.yaml ${OUT}/middlewares.yaml
  ```

## Config

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:cluster"="${K8S_CLUSTER}" \
  \
  --plaintext "environments[0]"="staging" \
  --plaintext "environments[1]"="production" \
  \
  --plaintext "web-app.image"="nginx" \
  --plaintext "web-app.replicas"="2"
```
