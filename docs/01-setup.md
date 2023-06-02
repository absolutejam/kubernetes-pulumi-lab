# Setup

- Bootstrap
- Create Gitea Orgs
- Create Gitea repos
- Create Woodpecker OAuth2 token
- Deploy Woodpecker

## Setting Woodpecker secrets

```bash
./bin/git-setup-oauth-application woodpecker https://k8s-lab.local/woodpecker/authorize
```

```bash
PROJECT=./k8s-lab/infra/woodpecker
SECRETS_ROOT=./secrets/woodpecker
OAUTH_TOKEN=$(cat ${SECRETS_ROOT}/oauth-application.json)
AGENT=$(cat ${SECRETS_ROOT}/agent-secret)

if [ -z "${OAUTH_TOKEN}" ] || [ -z "${AGENT}" ]; then
  echo "OAuth token or agent are empty"
  exit 1
fi

client=$(echo "${OAUTH_TOKEN}" | jq -r '.client_id')
secret=$(echo "${OAUTH_TOKEN}" | jq -r '.client_secret')

pulumi -C ${PROJECT} config set-all --path \
  --secret 'woodpecker-secrets.giteaClient'="${client}" \
  --secret 'woodpecker-secrets.giteaSecret'="${secret}" \
  --secret 'woodpecker-secrets.agent'="${AGENT}"

pulumi -C ${PROJECT} config get woodpecker-secrets
```
