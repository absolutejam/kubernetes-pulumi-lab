package logging

import (
	"os"

	"github.com/charmbracelet/lipgloss"
	charmlog "github.com/charmbracelet/log"
)

var opts = charmlog.Options{
	Prefix: "Labcoat",
	Level:  charmlog.InfoLevel,
}
var Log = charmlog.NewWithOptions(os.Stdout, opts)

func init() {
	charmlog.KeyStyles["create"] = lipgloss.NewStyle().
		Background(lipgloss.Color("#4F7942")).
		Foreground(lipgloss.Color("white"))

	charmlog.KeyStyles["update"] = lipgloss.NewStyle().
		Background(lipgloss.Color("#F08000")).
		Foreground(lipgloss.Color("white"))
}
