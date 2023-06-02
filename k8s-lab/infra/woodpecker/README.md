# Woodpecker

Resources to spin up a Woodpecker CI instance.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests" \
  \
  --secret    "woodpecker-secrets.agent"="..." \
  --plaintext "woodpecker-secrets.giteaClient"="..." \
  --secret    "woodpecker-secrets.giteaSecret"="..."
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "woodpecker.namespace"="woodpecker"
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
rm -rf manifests/0-crd/
rm -rf manifests/1-manifest/
rm -rf manifests/zz-secrets/
```