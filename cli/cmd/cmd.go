package cmd

import (
	charmlog "github.com/charmbracelet/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"k8s-lab.local/config"
	"k8s-lab.local/logging"
)

var log = logging.Log

var (
	rootCmd = &cobra.Command{
		Use:   "labcoat",
		Short: "k8s-lab CLI",
		Long:  `A CLI for bootstrapping & managing a local Kubernetes lab`,
		PersistentPreRun: func(cmd *cobra.Command, _ []string) {
			cfgFile, _ := cmd.Flags().GetString("config")

			if cfgFile != "" {
				// Use config file from the flag.
				viper.SetConfigFile(cfgFile)
			}
			if verbose, _ := cmd.Flags().GetBool("verbose"); verbose {
				log.SetLevel(charmlog.DebugLevel)
				log.Debug("Verbose logging enabled")
			}
		},
	}
)

func init() {
	cobra.OnInitialize(config.Init)

	rootCmd.PersistentFlags().String("config", "", "config (default is ./.k8s-lab.yaml)")
	rootCmd.PersistentFlags().BoolP("verbose", "v", false, "use verbose logging")
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(bootstrapCmd)
	rootCmd.AddCommand(projectCmd)
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		log.Fatal(err)
	}
}
