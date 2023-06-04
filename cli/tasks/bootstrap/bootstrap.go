package bootstrap

import (
	"k8s-lab.local/logging"
	"k8s-lab.local/projects"
	"k8s-lab.local/tasks/bootstrap/bootstrapopts"
	"k8s-lab.local/tasks/project/build"
	"k8s-lab.local/tasks/project/build/buildopts"
)

var log = logging.Log

func Bootstrap(opts bootstrapopts.Opts) {
	if opts.Preview {
		log.Infof("🥾 Bootstrapping group '%s' (Preview)", opts.Name)
	} else {
		log.Infof("🥾 Bootstrapping group '%s'", opts.Name)
	}
	for _, project := range opts.Projects {
		log.Debugf("  - %s", project.Name)
	}

	log := log.With("group", opts.Name)

	var (
		projectNames  = []string{}
		projectStacks = map[string]string{}
	)

	for _, project := range opts.Projects {
		projectNames = append(projectNames, project.Name)
		projectStacks[project.Name] = project.Stack
	}

	p, err := projects.GetMany(projectNames...)
	if err != nil {
		log.Fatal(err)
	}

	for _, project := range p {
		build.Build(buildopts.Opts{
			Project:       project,
			Stack:         projectStacks[project.Name],
			RecreateStack: opts.RecreateStack,
			Preview:       opts.Preview,
			Apply:         true,
		})

	}
}
