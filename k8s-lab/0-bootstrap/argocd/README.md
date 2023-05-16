# ArgoCD

Resources to spin up ArgoCD to facilitate a GitOps workflow.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "argocd.namespace"="argocd-system"
  ```


## Deployment

  - Generate the manifests 

    ```bash
    pulumi up -y
    ```

  - Encrypt secrets as `SealedSecret`s

    ```bash
    ./encrypt-secrets
    ```

  - Remove the plain secrets and apply the mainfests

    ```bash
    {
      # Move secrets
      mkdir -p ./manifests/zz-secrets
      mv ./manifests/1-manifest/v1-secret* ./manifests/zz-secrets || true

      # Apply CRDs
      kubectl apply --recursive -f ./manifests/0-crd/

      # Apply namespace resources
      kubectl apply -f ./manifests/1-manifest/*namespace* || true

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


## Accessing Gitea

  - Grab the initial password

    ```bash
    kubectl -n argocd-system get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 
    | base64 -d
    ```

  - Port-forward the admini UI

    ```bash
    kubectl -n argocd-system port-forward svc/argo-argocd-server 8000:80
    ```


## CLI access with `argocd`

TODO: