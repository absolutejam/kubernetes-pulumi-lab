# Debugging

## TLS errors

Validate ingress cert

```bash
openssl s_client \
  -showcerts \
  -servername k8s-lab.local \
  -connect k8s-lab.local:443 \
  </dev/null
```

## Debugging a container (eg. ArgoCD)

Debbuging a container

```bash
pod=$(kubectl -n argocd-system get pods -l app.kubernetes.io/component=server -o jsonpath='{.items[0].metadata.name}'

kunectl debug \
  -n argocd-system \
  --image=alpine \
  --target=server \
  --share-processes \
  --tty \
  -i \
  ${pod}
```
