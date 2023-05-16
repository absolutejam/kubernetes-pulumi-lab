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
  --plaintext "cert-manager.namespace"="cert-manager-system" \
  \
  --plaintext "trust-manager.namespace"="trust-manager-system" \
  \
  --plaintext "self-signed-issuer.namespace"="self-signed-issuer" \
  --plaintext "self-signed-issuer.namespace"="cert-manager-system" \
  --plaintext "self-signed-issuer.commonName"="self-signed-root-ca" \
  --plaintext "self-signed-issuer.secretName"="root-secret"
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