# Kubernetes lab

Resources to spin up test applications into a Kubernetes cluster.

```bash
export K3D_CLUSTER=local-lab
export K8S_CLUSTER=k3d-${K3D_CLUSTER}
export INGRESS="istio" # traefik or istio
```

## Cluster spinup

```bash
export VOLUME=/tmp/${K8S_CLUSTER}

mkdir -p ${VOLUME} 2> /dev/null

if [ "${INGRESS}" = "istio" ]; then
  additional_flags='--disable=traefik@server:*'
else
  additional_flags=''
fi

k3d cluster create ${K3D_CLUSTER} \
  --volume ${VOLUME}:${VOLUME} \
  --servers 3 \
  -p "8090:80@loadbalancer" \
  -p "8043:443@loadbalancer" \
  --k3s-arg ${additional_flags}
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
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/istio \
      ${OUT}/Base/Base.yaml
  ```

## Stack config

### Base config

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:cluster"="${K8S_CLUSTER}" \
  \
  --plaintext "environments[0]"="staging" \
  --plaintext "environments[1]"="production"
```

### Web-app config

```bash
pulumi config set-all --path \
  --plaintext "web-app.image"="nginx" \
  --plaintext "web-app.replicas"="2"
```

### Kubernetes dashboard config

```bash
pulumi config set-all --path \
  --plaintext "kubernetes-dashboard.namespace"="kubernetes-dashboard"
```

### Ingress config

- If using traefik...

  ```bash
  pulumi config set-all --path \
    --plaintext "ingress.type"="traefik" \
    --plaintext "ingress.install"="false" \
    --plaintext "ingress.namespace"="kube-system" \
    --plaintext "ingress.labels"='{
        "app.kubernetes.io/name": "traefik",
        "app.kubernetes.io/instance": "traefik"
      }'
  ```

- If using Istio...

  ```bash
  pulumi config set-all --path \
    --plaintext "ingress.type"="istio" \
    --plaintext "ingress.install"="true" \
    --plaintext "ingress.namespace"="istio-system" \
    --plaintext "ingress.labels"='{
        "istio": "ingressgateway"
      }'
  ```

## Layout

This is a monolithic Pulumi project, designed to spin up an entire cluster
with all required resources.

  - `config.ts` - Parses and exposes type-safe config
  - `builders/` - Contains `ComponentResource`s & functions to build other 
    resources.
  - `resources/` - This is where all of the resources are constructed, using
    values from the config, the builders, and dependent resources.
  - `index.ts` - Imports resources and exports outputs

## Resources

```
    TYPE                                                                    NAME
    pulumi:pulumi:Stack                                                     kubernetes-lab-dev
    │ 
    ├─ k8slab:infra:Istio                                                   istio
    │  ├─ kubernetes:core/v1:Namespace                                      istio-namespace
    │  │  ├─ kubernetes:helm.sh/v3:Release                                  istio-base
    │  │  ├─ kubernetes:helm.sh/v3:Release                                  istiod
    │  │  ├─ kubernetes:helm.sh/v3:Release                                  istio-gateway
    │  │  └─ kubernetes:networking.istio.io/v1beta1:Gateway                 istio-ingress-gateway
    │  └─ k8slab:infra:IstioPrometheusAddon                                 istio-prometheus
    │     └─ kubernetes:yaml:ConfigFile                                     prometheus-addon
    │        ├─ kubernetes:rbac.authorization.k8s.io/v1:ClusterRoleBinding  prometheus
    │        ├─ kubernetes:rbac.authorization.k8s.io/v1:ClusterRole         prometheus
    │        ├─ kubernetes:core/v1:ConfigMap                                istio-system/prometheus
    │        ├─ kubernetes:core/v1:ServiceAccount                           istio-system/prometheus
    │        ├─ kubernetes:apps/v1:Deployment                               istio-system/prometheus
    │        └─ kubernetes:core/v1:Service                                  istio-system/prometheus
    │ 
    ├─ k8slab:infra:PriorityClasses                                         priority-classes
    │  └─ kubernetes:scheduling.k8s.io/v1:PriorityClass                     business-critical
    │ 
    ├─ k8slab:infra:KubernetesDashboard                                     dashboard
    │  └─ kubernetes:core/v1:Namespace                                      dashboard-namespace
    │     ├─ kubernetes:core/v1:ServiceAccount                              dashboard-service-account
    │     ├─ kubernetes:helm.sh/v3:Release                                  dashboard
    │     ├─ kubernetes:rbac.authorization.k8s.io/v1:ClusterRoleBinding     dashboard-cluster-role-binding
    │     └─ kubernetes:core/v1:Secret                                      service-account-token
    │ 
    ├─ k8slab:app:WebApp                                                    web-app-production
    │  ├─ k8slab:app:WebAppIstioRoutes                                      web-app-production
    │  │  └─ kubernetes:networking.istio.io/v1beta1:VirtualService          web-app-production-virtualservice
    │  └─ kubernetes:core/v1:Namespace                                      web-app-production-namespace
    │     ├─ kubernetes:core/v1:ConfigMap                                   web-app-production-config
    │     ├─ kubernetes:core/v1:ResourceQuota                               web-app-production
    │     ├─ kubernetes:core/v1:LimitRange                                  web-app-production-limits
    │     ├─ kubernetes:apps/v1:Deployment                                  web-app-production-deployment
    │     │  └─ kubernetes:policy/v1:PodDisruptionBudget                    web-app-production-pdb
    │     └─ kubernetes:core/v1:Service                                     web-app-production-service
    │ 
    ├─ k8slab:app:WebApp                                                    web-app-staging
    │  ├─ k8slab:app:WebAppIstioRoutes                                      web-app-staging
    │  │  └─ kubernetes:networking.istio.io/v1beta1:VirtualService          web-app-staging-virtualservice
    │  └─ kubernetes:core/v1:Namespace                                      web-app-staging-namespace
    │     ├─ kubernetes:core/v1:ConfigMap                                   web-app-staging-config
    │     ├─ kubernetes:core/v1:LimitRange                                  web-app-staging-limits
    │     ├─ kubernetes:core/v1:ResourceQuota                               web-app-staging
    │     ├─ kubernetes:apps/v1:Deployment                                  web-app-staging-deployment
    │     │  └─ kubernetes:policy/v1:PodDisruptionBudget                    web-app-staging-pdb
    │     └─ kubernetes:core/v1:Service                                     web-app-staging-service
    │ 
    ├─ pulumi:providers:kubernetes                                          default_3_21_4
    └─ pulumi:providers:kubernetes                                          default
```

*(With added spacing)*