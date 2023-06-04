package project

import (
	"github.com/spf13/cobra"

	"k8s-lab.local/projects"
)

var (
	ListCmd = &cobra.Command{
		Use:   "list",
		Short: "Lists discovered projects",
		Args:  cobra.NoArgs,
		Run: func(_ *cobra.Command, _ []string) {
			projects := projects.Find()

			log.Infof("Discovered %d projects:", len(projects))
			for _, project := range projects {
				log.Infof("  - %s", project.Name)
			}
		},
	}
)
