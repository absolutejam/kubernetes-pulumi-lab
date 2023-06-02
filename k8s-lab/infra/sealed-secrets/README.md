# Sealed Secrets

Resources to spin add Sealed Secrets.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "sealed-secrets.namespace="sealed-secrets-namespace"
```

## Deployment

  - Generate the manifests 

    ```bash
    pulumi up -y
    ```

  - Apply the manifests

    ```bash
    {
      # Apply CRDs
      kubectl apply --recursive -f ./manifests/0-crd/

      # Apply namespace resources
      for file in manifests/1-manifest/*namespace*; do
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