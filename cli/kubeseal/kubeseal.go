package kubeseal

import (
	"os"
	"os/exec"

	"k8s-lab.local/kubeseal/encryptopts"
	"k8s-lab.local/logging"
)

var log = logging.Log

func Encrypt(opts encryptopts.Opts) error {
	args := []string{
		"--context", opts.Context,
		"--controller-name", opts.ControllerName,
		"--controller-namespace", opts.ControllerNamespace,
		"--format", opts.Format,
		"--secret-file", opts.InputFile,
		"--sealed-secret-file", opts.OutputFile,
	}
	if opts.AllowEmptyData {
		args = append(args, "--allow-empty-data")
	}

	cmd := exec.Command("kubeseal", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
