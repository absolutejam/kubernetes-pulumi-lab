package secrets

type SecretsProvider interface {
	GetSecret(name string) (string, error)
	SaveSecret(name string, content string) error
}

type FilesystemSecretsProvider struct {
	Root string
}

func (p *FilesystemSecretsProvider) GetSecret(name string) (string, error) {
	return "waffle123!", nil

}

func (p *FilesystemSecretsProvider) SaveSecret(name string, content string) error {
	return nil
}
