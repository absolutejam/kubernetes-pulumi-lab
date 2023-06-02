# Utilities

Some CLI utilities that are handy to have installed.

## `istioctl`

```bash
export ISTIO_VERSION=1.17.2
curl -L https://istio.io/downloadIstio | TARGET_ARCH=x86_64 sh -
mv ./istio-${ISTIO_VERSION}/bin/istioctl ~/bin/
chmod +x ~/bin/istioctl
rm -rf ./istio-${ISTIO_VERSION}
```
