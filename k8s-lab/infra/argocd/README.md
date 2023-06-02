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
  --plaintext "argocd.namespace"="argocd-system" \
  --plaintext "argocd.version"="..."
  ```


## Deployment

  - Generate the manifests 

    ```bash
    pulumi up -y
    ```

  - Apply the mainfests

    ```bash
    {
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


## Accessing Gitea

  - Grab the initial password

    ```bash
    kubectl -n argocd-system get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
    ```

  - Port-forward the admini UI

    ```bash
    kubectl -n argocd-system port-forward svc/argo-argocd-server 8000:80
    ```


## CLI access with `argocd`

TODO: