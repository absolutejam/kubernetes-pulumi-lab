package buildopts

import (
	"k8s-lab.local/projects"
)

type Opts struct {
	Project       projects.Project
	Stack         string
	RecreateStack bool
	Preview       bool
	Apply         bool
}
