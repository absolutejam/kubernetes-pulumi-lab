package cmd

import (
	"github.com/spf13/cobra"

	"k8s-lab.local/cmd/project"
)

var (
	projectCmd = &cobra.Command{
		Use:   "project",
		Short: "Shows info about discovered projects",
		Run: func(cmd *cobra.Command, _ []string) {
			cmd.Help()
		},
	}
)

func init() {
	projectCmd.AddCommand(project.ListCmd)
	projectCmd.AddCommand(project.InfoCmd)
	projectCmd.AddCommand(project.BuildCmd)
}
