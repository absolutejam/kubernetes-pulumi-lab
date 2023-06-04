package cmd

import (
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"

	"k8s-lab.local/tui/stage"
)

func NewProgram(initial stage.Model) *tea.Program {
	opts := []tea.ProgramOption{}
	opts = append(opts, tea.WithMouseCellMotion())
	return tea.NewProgram(initial, opts...)
}

var certTasks = []stage.Task{
	{
		Name:    "Generating root key",
		Message: `openssl genrsa -out ca.key 2048`,
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)
			return stage.TaskComplete{
				Status:  stage.Complete,
				Message: "",
			}
		},
	},
	{
		Name: "Generating CA key",
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)

			return stage.TaskComplete{
				Status:  stage.Complete,
				Message: "Couldn't generate CA key",
			}
		},
		Message: `openssl req -x509 -sha256 -new -nodes \
-key ca.key \
-days 3650 \
-subj "\
/C=GB\
/ST=London\
/L=London\
/O=Lab\
/OU=K8s Lab\
/CN=k8s-lab.local" \
-out ca.crt`,
	},
	{
		Name:    "Generating CA cert",
		Message: `openssl x509 -in ca.crt -text`,
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)

			return stage.TaskComplete{
				Status: stage.Complete,
			}
		},
	},
	{
		Name: "Another thing",
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)

			return stage.TaskComplete{
				Status:  stage.Failed,
				Message: "A thing broke!",
			}
		},
	},
	{
		Name: "Another thing",
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)

			return stage.TaskComplete{
				Status: stage.Complete,
			}
		},
	},
	{
		Name: "Another thing",
		Func: func() stage.TaskComplete {
			time.Sleep(time.Second * 1)

			return stage.TaskComplete{
				Status: stage.Complete,
			}
		},
	},
}

var (
	initCertCmd = &cobra.Command{
		Use:   "init-cert",
		Short: "Initialise the root CA cert",
		Run: func(cmd *cobra.Command, args []string) {
			s := stage.New(
				"🔐 Regenerating certs",
				stage.WithTasks(certTasks),
				// stage.WithHeight(20),
			)
			if _, err := tea.NewProgram(s).Run(); err != nil {
				log.Fatal(err)
			}
		},
	}
)
