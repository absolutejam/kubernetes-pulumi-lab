package cmd

import (
	"github.com/spf13/cobra"

	"k8s-lab.local/config"
	"k8s-lab.local/tasks/bootstrap"
	"k8s-lab.local/tasks/bootstrap/bootstrapopts"
)

var (
	bootstrapCmd = &cobra.Command{
		Use:   "bootstrap [default]",
		Short: "Bootstraps the cluster",
		Long: `Boostraps the core resources required for the cluster
to be functional`,
		Run: func(cmd *cobra.Command, args []string) {
			var (
				cfg        = config.Get()
				preview, _ = cmd.Flags().GetBool("preview")
				diff, _    = cmd.Flags().GetBool("diff")
			)

			var groups []string
			if len(args) == 0 {
				groups = []string{"default"}
			} else {
				groups = args
			}

			var bootstrapGroups []config.BootstrapGroup
			for _, groupName := range groups {
				bsg, ok := cfg.GetBootstrapGroup(groupName)
				if !ok {
					log.Fatalf("No such bootstrap group '%s'", groupName)
				}
				bootstrapGroups = append(bootstrapGroups, bsg)

			}

			for i, group := range bootstrapGroups {
				bootstrap.Bootstrap(bootstrapopts.Opts{
					Name:          groups[i],
					Projects:      group.Projects,
					Preview:       preview,
					RecreateStack: !diff,
				})
			}
		},
	}
)

func init() {
	bootstrapCmd.Flags().BoolP("preview", "p", false, "Preview only")
	bootstrapCmd.Flags().BoolP("diff", "d", false, "Diff (Retain the stack state)")
}
