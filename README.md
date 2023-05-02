# Kubernetes lab

Resources to spin up test applications into a Kubernetes cluster.

## Cluster spinup

```bash
export K3D_CLUSTER=local-lab
export K8S_CLUSTER=k3d-${K3D_CLUSTER}
export VOLUME=/tmp/${K8S_CLUSTER}

mkdir -p ${VOLUME} 2> /dev/null

k3d cluster create ${K3D_CLUSTER} \
  --volume ${VOLUME}:${VOLUME} \
  --servers 3 \
  -p "8090:80@loadbalancer"
```

## Setup

  - Pull dependencies

    ```bash
    npm install
    ```

  - Set up Pului state 
  
    NOTE: State is stored locally since this is just for a lab

    ```bash
    pulumi login file://$(PWD)/.state
    export PULUMI_CONFIG_PASSPHRASE='waffle123!'
    ```

  - Initialise the `dev` stack (Because the state is not tracked)

  - Select the `dev` stack

    ```bash
    pulumi stack select dev
    ```

## (Re)Generating Traefik CRDs

By default, `k3d` ships with Traefik installed in the cluster.

To generate the CRD definitions for use with Pulumi, you will need `pulumi2crd`
on your system.

- Export the CRD definitions from the cluster:

  ```bash
  OUT=./src/crds/source
  kubectl --context=${K8S_CLUSTER} get crd ingressroutes.traefik.containo.us -o yaml > ${OUT}/ingressroutes.yaml
  kubectl --context=${K8S_CLUSTER} get crd middlewares.traefik.containo.us -o yaml   > ${OUT}/middlewares.yaml
  ```

- Generate the Pulumi CRD definitions:

  ```bash
  crd2pulumi \
      --nodejs \
      --nodejsName crds \
      --nodejsPath src/crds/traefik \
      ${OUT}/ingressroutes.yaml ${OUT}/middlewares.yaml
  ```

## Stack config

```bash
pulumi config set-all --path \
  --plaintext "kubernetes:cluster"="${K8S_CLUSTER}" \
  \
  --plaintext "environments[0]"="staging" \
  --plaintext "environments[1]"="production" \
  \
  --plaintext "web-app.image"="nginx" \
  --plaintext "web-app.replicas"="2"
```

## Resources

It will current spin up a web app per environment.

The following `pulumi` output is generated using environments `production` and `staging`:

```
     Type                                                        Name                                      Plan     Info
     pulumi:pulumi:Stack                                         kubernetes-lab-dev                                 
     ├─ kubernetes:core/v1:Namespace                             webapp-production-namespace                        
     │  ├─ kubernetes:traefik.containo.us/v1alpha1:Middleware    webapp-production-strip-environment-path           
     │  ├─ kubernetes:core/v1:ConfigMap                          webapp-production-config                           
     │  ├─ kubernetes:traefik.containo.us/v1alpha1:IngressRoute  webapp-production-ingressroute                     
     │  ├─ kubernetes:core/v1:Service                            webapp-production-service                          
     │  └─ kubernetes:apps/v1:Deployment                         webapp-production-deployment                       
     └─ kubernetes:core/v1:Namespace                             webapp-staging-namespace                           
        ├─ kubernetes:traefik.containo.us/v1alpha1:Middleware    webapp-staging-strip-environment-path              
        ├─ kubernetes:core/v1:Service                            webapp-staging-service                             
        ├─ kubernetes:core/v1:ConfigMap                          webapp-staging-config                              
        ├─ kubernetes:traefik.containo.us/v1alpha1:IngressRoute  webapp-staging-ingressroute                        
        └─ kubernetes:apps/v1:Deployment                         webapp-staging-deployment                          
```

  - Hit the **production** instance at `http://localhost:8090/production`
  - Hit the **staging** instance at `http://localhost:8090/staging`
