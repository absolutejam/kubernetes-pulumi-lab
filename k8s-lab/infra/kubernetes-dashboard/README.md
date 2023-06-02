# Kubernetes Dashboard

Resources to spin up Kubernetes Dashboard.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "kubernetes-dashboard.namespace"=""
```

## Deployment

  - Generate the manifests 

    ```bash
    pulumi up -y
    ```

  - Apply the manifests

    ```bash
    {
      # Move plain secrets
      mkdir -p ./manifests/zz-secrets
      mv ./manifests/1-manifest/v1-secret* ./manifests/zz-secrets || true

      # Encrypt secrets as `SealedSecret`s
      ./encrypt-secrets

      # Apply CRDs
      kubectl apply --recursive -f ./manifests/0-crd/

      # Apply namespace resources
      for file in ./manifests/1-manifest/*namespace*; do
        kubectl apply -f ${file}
      done

      # Apply the rest of the manifests
      kubectl apply --recursive -f ./manifests/1-manifest
    }
    ```

### Completely regenerating the manifests

If you need to completely regenerate the manifests, you will need to delete
the stack and recreate it

```bash
pulumi stack rm prod --force --preserve-config -y
pulumi stack init prod
```


## Accessing the UI

  - Grab the service account token

    ```bash
    kubectl -n observability-kubernetes-dashboard get secrets dashboard-serviceacount-token -o jsonpath='{.data.token}' | base6 4 -d
    ```

  - Go to the interface: https://k8s-lab.local/kubernetes-dashboard/