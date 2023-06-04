package cmd

import (
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"

	"k8s-lab.local/logging"
	"k8s-lab.local/projects"
	"k8s-lab.local/tui/stage"
)

var log = logging.Log

var (
	initGitCmd = &cobra.Command{
		Use:   "init-git",
		Short: "Initialise git repos",
		Run: func(_ *cobra.Command, args []string) {
			var gitTasks []stage.Task

			for _, projectName := range args {
				project, err := projects.Get(projectName)
				if err != nil {
					log.Warnf("No such project: %s", projectName)
					continue
				}

				gitTasks = append(gitTasks, stage.Task{
					Name: "Provision repo: " + project.Name,
					Func: func() stage.TaskComplete {

						time.Sleep(time.Second * 1)
						return stage.TaskComplete{
							Status: stage.Complete,
						}
					},
				})
			}

			s := stage.New(
				"🔨 Provisioning git repos",
				stage.WithTasks(gitTasks),
				// stage.WithHeight(20),
			)
			if _, err := tea.NewProgram(s).Run(); err != nil {
				log.Fatal(err)
			}
		},
	}
)
