package provisionrepoopts

type Opts struct {
	Url      string
	Username string
	Password string
}

func DefaultOpts() Opts {
	return Opts{
		Url:      "https://k8s-lab.local/gitea/",
		Username: "gitea-admin",
		Password: "waffle123!",
	}
}
