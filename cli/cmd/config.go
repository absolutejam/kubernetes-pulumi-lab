package cmd

import (
	"github.com/sanity-io/litter"
	"github.com/spf13/cobra"

	"k8s-lab.local/config"
)

var (
	configCmd = &cobra.Command{
		Use:   "config",
		Short: "Shows the built config",
		Run: func(_ *cobra.Command, _ []string) {
			cfg := config.Get()
			log.Info(litter.Sdump(cfg))
		},
	}
)
