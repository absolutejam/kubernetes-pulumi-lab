# k8s-lab

This is a mono-repo, containing all of the resources required to set up a
fully-featured Kubernetes cluster, complete with GitOps deployment workflows,
Istio service mesh and other goodies.


## Cluster setup

Spin up the cluster with `k3d`

  - Export some reusable variables

    ```bash
    export K3D_CLUSTER=local-lab
    export K8S_CLUSTER=k3d-${K3D_CLUSTER}
    ```


  - Spin up the cluster

    **NOTE:** Traefik is not deployed

    ```bash
    export VOLUME=/tmp/${K8S_CLUSTER}

    mkdir -p ${VOLUME} || true

    k3d cluster create ${K3D_CLUSTER} \
      --volume ${VOLUME}:${VOLUME} \
      --servers 3 \
      -p "8090:80@loadbalancer" \
      -p "8043:443@loadbalancer" \
      --k3s-arg 'disable=traefik@server:*'
    ```


## Pulumi setup

- Set up the Pulumi state store which is used by all of the individual Pulumi 
  projects

  NOTE: State is stored locally since this is just for a lab

  ```bash
  pulumi login file://${PWD}/.state
  export PULUMI_CONFIG_PASSPHRASE='waffle123!'
  ```


## Utilities

Some CLI utilities that are handy to have installed.

### `istioctl`

```bash
export ISTIO_VERSION=1.17.2
curl -L https://istio.io/downloadIstio | TARGET_ARCH=x86_64 sh -
mv ./istio-${ISTIO_VERSION}/bin/istioctl ~/bin/
chmod +x ~/bin/istioctl
rm -rf ./istio-${ISTIO_VERSION}
```


## CRDs

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

### Istio

- Export the CRD from `istioctl`:

  ```bash
  OUT=./k8s-lab/crds/__source/istio
  mkdir -p ${OUT}
  istioctl manifest generate -o ${OUT}
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/istio \
      ${OUT}/Base/Base.yaml
  ```

### Kiali

- Export the CRDs from the cluster:

  ```bash
  OUT=./k8s-lab/crds/__source/kiali
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd kialis.kiali.io -o yaml > ${OUT}/kialis.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/kiali \
      ${OUT}/kialis.yaml
  ```

  **NOTE:** The Kiali CRD does not generate a useful CRD as there is no `spec`
  defined. To fix this, I have changed the definition to allow an untyped `spec`:

  ```yaml
  - name: v1alpha1
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec: 
            type: object
            description: Kiali CRD fields
  ```

### Cert Manager 

- Export the CRDs from the cluster:

  ```bash
  OUT=./k8s-lab/crds/__source/cert-manager
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd certificaterequests.cert-manager.io -o yaml > ${OUT}/certificaterequests.yaml
  kubectl --context=${K8S_CLUSTER} get crd certificates.cert-manager.io -o yaml        > ${OUT}/certificates.yaml
  kubectl --context=${K8S_CLUSTER} get crd issuers.cert-manager.io -o yaml             > ${OUT}/issuers.yaml
  kubectl --context=${K8S_CLUSTER} get crd clusterissuers.cert-manager.io -o yaml      > ${OUT}/clusterissuers.yaml
  kubectl --context=${K8S_CLUSTER} get crd challenges.acme.cert-manager.io -o yaml     > ${OUT}/challenges.yaml
  kubectl --context=${K8S_CLUSTER} get crd orders.acme.cert-manager.io -o yaml         > ${OUT}/orders.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/cert-manager-crds \
      ${OUT}/challenges.yaml ${OUT}/certificaterequests.yaml ${OUT}/certificates.yaml ${OUT}/challenges.yaml ${OUT}/clusterissuers.yaml ${OUT}/issuers.yaml
  ```

### Sealed Secrets

- Export the CRDs from the cluster:

  ```bash
  OUT=./k8s-lab/crds/__source/sealed-secrets
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd sealedsecrets.bitnami.com -o yaml > ${OUT}/sealed-secrets.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/sealed-secrets-crds \
      ${OUT}/sealed-secrets.yaml
  ```

### ArgoCD

- Export the CRDs from the cluster:

  ```bash
  OUT=./k8s-lab/crds/__source/argocd
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd applications.argoproj.io -o yaml    > ${OUT}/applications.yaml
  kubectl --context=${K8S_CLUSTER} get crd applicationsets.argoproj.io -o yaml > ${OUT}/applicationsets.yaml
  kubectl --context=${K8S_CLUSTER} get crd appprojects.argoproj.io -o yaml     > ${OUT}/appprojects.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/argocd-crds \
      ${OUT}/applications.yaml ${OUT}/applicationsets.yaml ${OUT}/appprojects.yaml
  ```

### Prometheus

- Export the CRDs from the cluster:

  ```bash
  OUT=./k8s-lab/crds/__source/prometheus
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd alertmanagerconfigs.monitoring.coreos.com -o yaml > ${OUT}/alertmanagerconfigs.yaml
  kubectl --context=${K8S_CLUSTER} get crd alertmanagers.monitoring.coreos.com -o yaml       > ${OUT}/alertmanagers.yaml
  kubectl --context=${K8S_CLUSTER} get crd podmonitors.monitoring.coreos.com -o yaml         > ${OUT}/podmonitors.yaml
  kubectl --context=${K8S_CLUSTER} get crd probes.monitoring.coreos.com -o yaml              > ${OUT}/probes.yaml
  kubectl --context=${K8S_CLUSTER} get crd prometheuses.monitoring.coreos.com -o yaml        > ${OUT}/prometheuses.yaml
  kubectl --context=${K8S_CLUSTER} get crd prometheusrules.monitoring.coreos.com -o yaml     > ${OUT}/prometheusrules.yaml
  kubectl --context=${K8S_CLUSTER} get crd servicemonitors.monitoring.coreos.com -o yaml     > ${OUT}/servicemonitors.yaml
  kubectl --context=${K8S_CLUSTER} get crd thanosrulers.monitoring.coreos.com -o yaml        > ${OUT}/thanosrulers.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/prometheus-crds \
      ${OUT}/alertmanagerconfigs.yaml ${OUT}/alertmanagers.yaml ${OUT}/podmonitors.yaml ${OUT}/probes.yaml ${OUT}/prometheuses.yaml ${OUT}/prometheusrules.yaml ${OUT}/servicemonitors.yaml ${OUT}/thanosrulers.yaml
  ```


## Setup

  - First, we need to bootstrap the core resources:
  
    - `istio`
    - `istio-ingress`
    - `sealed-secrets`
    - `argocd`
    - `gitea`

  - Set up repos
  
    ``bash
    tea repo create --name 'gitea'
    tea repo create --name 'istio'
    tea repo create --name 'argocd'
    ```

  - Now push resources to each repo

    ```bash
    cd ./k8s-lab/0-bootstrap/argocd


## Notes

### Secrets

Instead of storing plain `Secret` resources in the repo, all secrets are 
encrypted as a `SealedSecret`.


## TODO:

  - Apply labels to each project (via. a transform?)

    ```ts
    const labels = {
      "app.kubernetes.io/tier": "infra",
      "app.kubernetes.io/name": name,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };
    ```
