package git

import (
	"crypto/tls"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"code.gitea.io/sdk/gitea"

	"k8s-lab.local/logging"
	"k8s-lab.local/tasks/git/provisionrepoopts"
	"k8s-lab.local/tasks/git/provisiontokenopts"
)

var log = logging.Log

var (
	tokenBaseName = "k8s-lab"
	letters       = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func generateId(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func httpClient() *http.Client {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	httpClient := http.Client{Timeout: time.Duration(1) * time.Second, Transport: transport}
	return &httpClient
}

func ProvisionToken(opts provisiontokenopts.Opts) (*gitea.AccessToken, error) {
	client, err := gitea.NewClient(
		opts.Url,
		gitea.SetHTTPClient(httpClient()),
		gitea.SetBasicAuth(opts.Username, opts.Password),
	)

	if err != nil {
		log.Fatalf("Could not create client: %+v\n", err)
	}

	accessToken, _, err := client.CreateAccessToken(
		gitea.CreateAccessTokenOption{
			Name: string(generateId(8)),
			Scopes: []gitea.AccessTokenScope{
				gitea.AccessTokenScopeAll,
			},
		})
	if err != nil {
		log.Fatalf("Could not provision access token: %+v\n", err)
	}

	return accessToken, nil
}

func ProvisionRepos(token string, opts provisionrepoopts.Opts) error {
	basicClient, err := gitea.NewClient(
		"https://k8s-lab.local/gitea/",
		gitea.SetHTTPClient(httpClient()),
		gitea.SetToken(token),
	)

	if err != nil {
		panic(err.Error())
	}

	accessToken, _, err := basicClient.CreateAccessToken(
		gitea.CreateAccessTokenOption{
			Name: fmt.Sprintf(tokenBaseName, "-", generateId(8)),
			Scopes: []gitea.AccessTokenScope{
				gitea.AccessTokenScopeAll,
			},
		})

	if err != nil {
		log.Fatalf(err.Error())
		panic(err.Error())
	}

	if accessToken != nil {
		log.Info("%+v\n", accessToken)
	}

	// giteaClient, err := gitea.NewClient("https://k8s-lab.local", gitea.SetToken(token))
	// if err != nil {
	// 	panic(err)
	// }
}
