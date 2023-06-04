package build

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optremove"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"

	"k8s-lab.local/config"
	"k8s-lab.local/kubectl"
	"k8s-lab.local/kubectl/kubectlapplyopts"
	"k8s-lab.local/kubectl/kubectlwaitforopts"
	"k8s-lab.local/kubeseal"
	"k8s-lab.local/kubeseal/encryptopts"
	"k8s-lab.local/logging"
	"k8s-lab.local/tasks/project/build/buildopts"
)

var log = logging.Log

type ManifestDirs struct {
	Root      string
	Crds      string
	Manifests string
	Secrets   string
}

func buildManifestDirs(root string) ManifestDirs {
	return ManifestDirs{
		Root:      root,
		Crds:      path.Join(root, "0-crd"),
		Manifests: path.Join(root, "1-manifest"),
		Secrets:   path.Join(root, "zz-secrets"),
	}
}

func (m *ManifestDirs) Clean() error {
	if err := os.RemoveAll(m.Crds); err != nil {
		return err
	}

	if err := os.RemoveAll(m.Manifests); err != nil {
		return err
	}

	if err := os.RemoveAll(m.Secrets); err != nil {
		return err
	}

	return nil
}

func (m *ManifestDirs) MoveSecrets() ([]string, error) {
	var (
		secrets     []string
		secretsGlob = path.Join(m.Manifests, "v1-secret*.yaml")
	)

	if _, err := os.Stat(m.Secrets); os.IsNotExist(err) {
		log.Debug("Creating secrets directory")
		os.Mkdir(m.Secrets, os.ModePerm)
	}

	files, err := filepath.Glob(secretsGlob)
	if err != nil {
		return secrets, err
	}

	for _, file := range files {
		fileName := filepath.Base(file)
		newPath := path.Join(m.Secrets, fileName)
		secrets = append(secrets, newPath)

		err := os.Rename(file, newPath)
		if err != nil {
			return secrets, err
		}
	}

	return secrets, nil

}

// Build will build a Pulumi project's Kubernetes manifests by running `pulumi up`.
//
// It may also apply the manifests if given the `Apply` option.
func Build(opts buildopts.Opts) {
	var (
		cfg              = config.Get()
		pulumiPassphrase = cfg.PulumiPassphrase
		stackName        = "prod"
		env              = map[string]string{
			"PULUMI_CONFIG_PASSPHRASE": pulumiPassphrase,
			"PULUMI_SKIP_UPDATE_CHECK": "true",
		}
	)

	if opts.Stack != "" {
		stackName = opts.Stack
	}

	ctx := context.Background()
	log := log.With(
		"stackName", stackName,
		"projectName", opts.Project.Name,
	)

	log.Debugf("Loading stack: %s", stackName)
	stack, err := auto.SelectStackLocalSource(
		ctx,
		stackName,
		opts.Project.Path,
		auto.WorkDir(opts.Project.Path),
		auto.EnvVars(env),
	)
	if err != nil {
		log.Fatalf("Could not load stack %s: %+v\n", stackName, err)
	}

	manifestsRoot, err := getManifestsRoot(ctx, &stack)
	if err != nil {
		log.Fatal(err)
	}

	manifestDirs := buildManifestDirs(manifestsRoot)

	// TODO: create stack if it doesn't already exist

	if opts.RecreateStack {
		log.Debug("Recreating stack")
		recreateStack(ctx, stack)

		log.Debug("Cleaning existing manifests directories")
		manifestDirs.Clean()
	}

	log.Infof("🚀 %s", opts.Project.Name)
	if opts.Preview {
		summary, err := stack.Preview(
			ctx,
			optpreview.ProgressStreams(ioutil.Discard),
			optpreview.ErrorProgressStreams(ioutil.Discard),
		)
		if err != nil {
			log.Fatal(err)
			return
		}

		log.Info(
			"Summary",
			"create", summary.ChangeSummary["create"],
			"update", summary.ChangeSummary["update"],
		)

	} else {
		summary, err := stack.Up(
			ctx,
			optup.ProgressStreams(ioutil.Discard),
			optup.ErrorProgressStreams(ioutil.Discard),
		)
		if err != nil {
			log.Fatal(err)
			return
		}

		changes := *summary.Summary.ResourceChanges
		log.Info(
			"Summary",
			"create", changes["create"],
			"update", changes["update"],
		)

		if err := applyManifests(cfg.Context, &manifestDirs); err != nil {
			log.Fatal(err)
		}

		if opts.Project.Opts != nil && len(opts.Project.Opts.WaitFor) > 0 {
			timeout := "30s" // TODO:
			log.Infof("Waiting for %d resources", len(opts.Project.Opts.WaitFor))
			for _, waitFor := range opts.Project.Opts.WaitFor {
				log.Info(
					fmt.Sprintf("Waiting for %s", waitFor.Resource),
					"namespace", waitFor.Namespace,
					"timeout", timeout,
				)

				err := kubectl.WaitFor(kubectlwaitforopts.Opts{
					Context:   cfg.Context,
					Resource:  waitFor.Resource,
					Condition: waitFor.Condition,
					Namespace: waitFor.Namespace,
					Timeout:   timeout,
				})
				if err != nil {
					log.Fatal(err)
				}
			}

		}
	}
}

func getManifestsRoot(ctx context.Context, stack *auto.Stack) (string, error) {
	manifestsRootCfg, err := stack.GetConfig(ctx, "kubernetes:renderYamlToDirectory")
	if err != nil {
		return "", err
	}

	var manifestsRoot = manifestsRootCfg.Value
	if !path.IsAbs(manifestsRoot) {
		manifestsRoot = path.Join(stack.Workspace().WorkDir(), manifestsRoot)
	}

	return manifestsRoot, nil
}

func applyManifests(context string, manifestDirs *ManifestDirs) error {
	log.Debug("Moving secrets")
	secrets, err := manifestDirs.MoveSecrets()
	if err != nil {
		return err
	}

	log.Infof("Encrypting %d secrets", len(secrets))
	for _, secret := range secrets {
		sealedSecretFilename := strings.ReplaceAll(
			path.Base(secret),
			"v1-secret",
			"bitnami.com_v1alpha1-sealedsecret",
		)
		sealedSecret := path.Join(manifestDirs.Manifests, sealedSecretFilename)

		err := kubeseal.Encrypt(encryptopts.Opts{
			Context:             context,
			ControllerName:      "sealed-secrets",
			ControllerNamespace: "sealed-secrets-system",
			AllowEmptyData:      true,
			Format:              "yaml",
			InputFile:           secret,
			OutputFile:          sealedSecret,
		})

		if err != nil {
			// TODO:
			return err
		}

	}

	crds, _ := filepath.Glob(filepath.Join(manifestDirs.Crds, "*.yaml"))
	log.Infof("Applying %d CRDs", len(crds))
	if len(crds) > 0 {
		err = kubectl.Apply(kubectlapplyopts.Opts{
			Context:   context,
			Path:      manifestDirs.Crds,
			Recursive: true,
		})
		if err != nil {
			return err
		}
	}

	nsManifests, _ := filepath.Glob(filepath.Join(manifestDirs.Manifests, "v1-namespace*.yaml"))
	log.Infof("Applying %d Namespace manifests", len(nsManifests))
	for _, nsManifest := range nsManifests {
		err = kubectl.Apply(kubectlapplyopts.Opts{
			Context: context,
			Path:    nsManifest,
		})
		if err != nil {
			return err
		}
	}

	manifests, _ := filepath.Glob(filepath.Join(manifestDirs.Manifests, "*.yaml"))
	log.Infof("Applying %d manifests", len(manifests))
	err = kubectl.Apply(kubectlapplyopts.Opts{
		Context:   context,
		Path:      manifestDirs.Manifests,
		Recursive: true,
	})
	if err != nil {
		return err
	}

	return nil
}

func recreateStack(ctx context.Context, stack auto.Stack) {
	config, err := stack.GetAllConfig(ctx)
	if err != nil {
		log.Fatalf("Could not retrieve the config before resetting the stack state: %+v\n", err)
	}
	_ = stack.Workspace().RemoveStack(ctx, stack.Name(), optremove.Force())
	_ = stack.Workspace().CreateStack(ctx, stack.Name())
	_ = stack.Workspace().SelectStack(ctx, stack.Name())
	_ = stack.SetAllConfig(ctx, config)
}
