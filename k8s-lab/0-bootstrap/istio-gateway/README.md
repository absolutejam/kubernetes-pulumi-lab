# Istio Gateway

Resources to spin up an Istio Gateway, for ingress into the cluster


## Stack config

**Required config**

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:renderYamlToDirectory"="./manifests"
```

Optional config:

```bash
pulumi config set-all --path \
  --plaintext "istio-gateway.namespace"="istio-system" \
  \
  --plaintext "istio-gateway.tls.enabled"="true" \
  --plaintext "istio-gateway.tls.commonName"="k8s-lab.local" \
  --plaintext "istio-gateway.tls.issuerKind"="ClusterIssuer" \
  --plaintext "istio-gateway.tls.issuerName"="self-signed-issuer" \
  --plaintext "istio-gateway.tls.certSecretName"="ingress-cert" \
  --plaintext "istio-gateway.tls.hostnames[0]"="k8s-lab.local" \
  \
  --plaintext "istio-gateway.selector"='{
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