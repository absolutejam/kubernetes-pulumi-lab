package kubectl

import (
	"fmt"
	"os"
	"os/exec"

	"k8s-lab.local/kubectl/kubectlapplyopts"
	"k8s-lab.local/kubectl/kubectlwaitforopts"
	"k8s-lab.local/logging"
)

var log = logging.Log

func Apply(opts kubectlapplyopts.Opts) error {
	if opts.Context == "" {
		log.Fatal("No context provided")
	}

	args := []string{
		"--context", opts.Context,
		"apply",
		"--server-side",
		"-f", opts.Path,
	}

	cmd := exec.Command("kubectl", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

func WaitFor(opts kubectlwaitforopts.Opts) error {
	args := []string{
		"--context", opts.Context,
		"--namespace", opts.Namespace,
		"wait",
		"--for", fmt.Sprintf("condition=%s", opts.Condition),
		"--timeout", opts.Timeout,
		opts.Resource,
	}

	cmd := exec.Command("kubectl", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
