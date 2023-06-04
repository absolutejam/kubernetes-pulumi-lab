package bootstrapopts

import (
	"k8s-lab.local/config"
)

type Opts struct {
	Name          string
	Projects      []config.BootstrapGroupProject
	Preview       bool
	RecreateStack bool
}
