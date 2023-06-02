# CRDs

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

**NOTE:** After generating any CRDs, you will need to set the `version` in the
`package.json`. Just set this to the same version as teh Kubernetes provider,
eg.

```json
"version": "3.21.4",
```

## Istio

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

## Kiali

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
  defined. To fix this, I have changed the definition to allow an untyped
  `spec`:

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
  kubectl --context=${K8S_CLUSTER} get crd bundles.trust.cert-manager.io -o yaml       > ${OUT}/bundles.yaml
  ```

- Generate the Pulumi CRD types:

  ```bash
  crd2pulumi \
      --force \
      --nodejs \
      --nodejsName crds \
      --nodejsPath k8s-lab/crds/cert-manager-crds \
      ${OUT}/challenges.yaml ${OUT}/certificaterequests.yaml ${OUT}/certificates.yaml ${OUT}/challenges.yaml ${OUT}/clusterissuers.yaml ${OUT}/issuers.yaml ${OUT}/bundles.yaml
  ```

## Sealed Secrets

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

## ArgoCD

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

## Prometheus

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
