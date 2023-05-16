# Core

Resources to spin up test applications into a Kubernetes cluster.

```bash
export K3D_CLUSTER=local-lab
export K8S_CLUSTER=k3d-${K3D_CLUSTER}
```

## Cluster spinup

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

## Setup

- Pull dependencies

  ```bash
  npm install
  ```

- Set up Pulumi state

  NOTE: State is stored locally since this is just for a lab

  ```bash
  pulumi login file://${PWD}/.state
  export PULUMI_CONFIG_PASSPHRASE='waffle123!'
  ```

- Initialise the `dev` stack (Because the state is not tracked)

  ```bash
  rm -rf .state/.pulumi || true
  pulumi stack init dev
  ```

- Select the `dev` stack

  ```bash
  pulumi stack select dev
  ```

## Traefik

### (Re)Generating Traefik CRDs
By default, `k3d` ships with Traefik installed in the cluster.

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD definitions from the cluster:

  ```bash
  OUT=./src/crds/source/traefik
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd ingressroutes.traefik.containo.us -o yaml > ${OUT}/ingressroutes.yaml
  kubectl --context=${K8S_CLUSTER} get crd middlewares.traefik.containo.us -o yaml   > ${OUT}/middlewares.yaml
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/traefik \
      ${OUT}/ingressroutes.yaml ${OUT}/middlewares.yaml
  ```

## Istio

### Installing `istioctl` locally

```bash
export ISTIO_VERSION=1.17.2
curl -L https://istio.io/downloadIstio | TARGET_ARCH=x86_64 sh -
mv ./istio-${ISTIO_VERSION}/bin/istioctl ~/bin/
chmod +x ~/bin/istioctl
rm -rf ./istio-${ISTIO_VERSION}
```

### (Re)Generating Istio CRDs

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD from `istioctl`:

  ```bash
  OUT=./src/crds/source/istio
  mkdir -p ${OUT}
  istioctl manifest generate -o ${OUT}
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/istio \
      ${OUT}/Base/Base.yaml
  ```

### (Re)Generating Kiali Operator CRDs

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD from the cluster:

  ```bash
  OUT=./src/crds/source/kiali
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd kialis.kiali.io -o yaml > ${OUT}/kialis.yaml
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/kiali \
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

## Cert Manager 

### (Re)Generating Cert Manager CRDs

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD definitions from the cluster:

  ```bash
  OUT=./src/crds/source/cert-manager
  mkdir -p ${OUT}
  kubectl --context=${K8S_CLUSTER} get crd certificaterequests.cert-manager.io -o yaml > ${OUT}/certificaterequests.yaml
  kubectl --context=${K8S_CLUSTER} get crd certificates.cert-manager.io -o yaml        > ${OUT}/certificates.yaml
  kubectl --context=${K8S_CLUSTER} get crd issuers.cert-manager.io -o yaml             > ${OUT}/issuers.yaml
  kubectl --context=${K8S_CLUSTER} get crd clusterissuers.cert-manager.io -o yaml      > ${OUT}/clusterissuers.yaml
  kubectl --context=${K8S_CLUSTER} get crd challenges.acme.cert-manager.io -o yaml     > ${OUT}/challenges.yaml
  kubectl --context=${K8S_CLUSTER} get crd orders.acme.cert-manager.io -o yaml         > ${OUT}/orders.yaml
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/cert-manager \
      ${OUT}/challenges.yaml ${OUT}/certificaterequests.yaml ${OUT}/certificates.yaml ${OUT}/challenges.yaml ${OUT}/clusterissuers.yaml ${OUT}/issuers.yaml
  ```

## Prometheus

### (Re)Generating Prometheus CRDs

Most of this can be done via. the Helm chart, but it's nice to have access
to the actual CRDs (eg. `PrometheusRule`)

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD definitions from the cluster:

  ```bash
  OUT=./src/crds/source/prometheus
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

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/prometheus \
      ${OUT}/alertmanagerconfigs.yaml ${OUT}/alertmanagers.yaml ${OUT}/podmonitors.yaml ${OUT}/probes.yaml ${OUT}/prometheuses.yaml ${OUT}/prometheusrules.yaml ${OUT}/servicemonitors.yaml ${OUT}/thanosrulers.yaml
  ```

## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="dist"
```

Optional config:

```bash
pulumi config set-all --path \
  \
  --plaintext "istio.namespace"="istio-system" \
  --plaintext "istio.selector"='{
      "istio": "gateway"
    }' \
  \
  --plaintext "ingress.namespace"="istio-system" \
  \
  --plaintext "cert-manager.namespace"="cert-manager" \
  ```

  And if using TLS...

  ```bash
  pulumi config set-all --path \
    --plaintext "ingress.tls.enabled"="true" \
    --plaintext "ingress.tls.commonName"="localhost" \
    --plaintext "ingress.tls.issuerKind"="ClusterIssuer" \
    --plaintext "ingress.tls.issuerName"="self-signed-issuer" \
    --plaintext "ingress.tls.certSecretName"="ingress-cert" \
    --plaintext "ingress.tls.hostnames[0]"="localhost.local"
  ```


## Misc

### Monitoring

This project leverages the `kube-prometheus-stack` Helm chart to deploy multiple
components (Prometheus operator, Prometheus instance, Grafana, etc.).


#### Discovering pods that are discoverable by Prometheus

This will find any pods with annotations containing `prometheus` in them. 

Namely, we are looking for `prometheus.io/scrape` and `prometheus.io/port`.
`
```bash
 kubectl get svc -A -o json | jq '
.items[]
| select(.metadata.annotations // {} | to_entries | map(.key) | any(. | test(".*prometheus.*")))
| {
    name: .metadata.name,
    namespace: .metadata.namespace,
    annotations: .metadata.annotations
  }
'
