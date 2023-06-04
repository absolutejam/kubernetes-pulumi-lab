package project

import (
	"github.com/sanity-io/litter"
	"github.com/spf13/cobra"

	"k8s-lab.local/logging"
	"k8s-lab.local/projects"
)

var log = logging.Log

var (
	InfoCmd = &cobra.Command{
		Use:   "info project",
		Short: "Shows info about discovered projects",
		Long:  `Shows information about the provided projects`,
		Args:  cobra.ArbitraryArgs,
		Run: func(_ *cobra.Command, args []string) {
			if len(args) == 0 {
				log.Warn("No project name(s) supplied.\nPlease run `labcoat project list` for a list of available projects.")
			}
			projects, err := projects.GetMany(args...)
			if err != nil {
				log.Fatal(err)
			}

			for _, project := range projects {
				log.Info(litter.Sdump(project))
			}
		},
	}
)
