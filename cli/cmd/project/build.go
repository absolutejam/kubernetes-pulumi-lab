package project

import (
	"strings"

	"github.com/spf13/cobra"

	"k8s-lab.local/projects"
	"k8s-lab.local/tasks/project/build"
	"k8s-lab.local/tasks/project/build/buildopts"
)

var (
	BuildCmd = &cobra.Command{
		Use:   "build project [project]...",
		Short: "Build (and launch) a Pulumi project",
		ValidArgsFunction: func(_ *cobra.Command, _ []string, toComplete string) ([]string, cobra.ShellCompDirective) {
			allProjects := projects.Find()
			var matchingProjects []string

			for _, project := range allProjects {
				if strings.Contains(project.Name, toComplete) {
					matchingProjects = append(matchingProjects, project.Name)
				}
			}

			return matchingProjects, cobra.ShellCompDirectiveDefault

		},
		Args: cobra.OnlyValidArgs,
		Run: func(cmd *cobra.Command, args []string) {
			var (
				preview, _ = cmd.Flags().GetBool("preview")
				diff, _    = cmd.Flags().GetBool("diff")
				stack, _   = cmd.Flags().GetString("stack")
				apply, _   = cmd.Flags().GetBool("apply")
			)

			p, err := projects.GetMany(args...)
			if err != nil {
				log.Fatal(err)
			}

			for _, project := range p {
				build.Build(buildopts.Opts{
					Project:       project,
					Stack:         stack,
					Preview:       preview,
					RecreateStack: !diff,
					Apply:         apply,
				})
			}
		},
	}
)

func init() {
	BuildCmd.Flags().BoolP("preview", "p", false, "Preview only")
	BuildCmd.Flags().BoolP("diff", "d", false, "Diff (Retain the stack state)")
	BuildCmd.Flags().BoolP("apply", "a", false, "Apply the built manifests")
}
