# Gitea

Resources to spin up Gitea instance to facilitate self-contained GitOps worfklow.


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "gitea.namespace"="gitea"
```

## Deployment

  - Generate the manifests 

    ```bash
    pulumi up -y
    ```

  - Apply the manifests

    ```bash
    {
      # Encrypt secrets as `SealedSecret`s
      ./encrypt-secrets

      # Move plain secrets
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

```bash
kubectl -n gitea port-forward svc/gitea-http 3000:3000
```

## CLI access with `tea`

  - Browse to http://localhost:3000/user/settings/applications

  - Generate a token

  - Log in with `tea`

    ```bash
    tea login add \
      --insecure \
      --name k8s-lab-proxy \
      --url 'http://localhost:3000' \
      --user 'gitea-admin' \
      --password 'waffle123!' \
      --token '<token>'

    tea login default k8s-lab-proxy
    ```