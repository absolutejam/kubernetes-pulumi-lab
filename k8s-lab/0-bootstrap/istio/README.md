# Istio

Resources to spin up Istio service mesh.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
# Core

Optional config:

```bash
pulumi config set-all --path \
  \
  --plaintext "istio.namespace"="istio-system" \
  --plaintext "istio.selector"='{
      "istio": "gateway"
    }'
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