package projects

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/spf13/viper"

	"k8s-lab.local/config"
)

type Project struct {
	Name string
	Path string
	Opts *config.ProjectOptsConfig
}

func Find() []Project {
	cfg := config.Get()
	projectRoots := viper.GetStringSlice("project_roots")

	var projects []Project
	for _, projectRoot := range projectRoots {
		root := projectRoot

		if !filepath.IsAbs(projectRoot) {
			var cwd string
			if cfg.Cwd != "" {
				cwd, _ = filepath.Abs(cfg.Cwd)
			} else {
				cwd, _ = os.Getwd()
			}

			root = filepath.Join(cwd, root)
		}

		dirs, _ := ioutil.ReadDir(root)
		for _, file := range dirs {
			filePath := filepath.Join(root, file.Name())
			project := Project{
				Name: file.Name(),
				Path: filePath,
			}

			if opts, ok := cfg.GetProjectOpts(project.Name); ok {
				project.Opts = &opts
			}
			projects = append(projects, project)
		}
	}

	return projects
}

func Get(projectName string) (Project, error) {
	for _, project := range Find() {
		if project.Name == projectName {
			return project, nil
		}
	}

	return Project{}, fmt.Errorf("could not find project '%s'", projectName)
}

// TODO: errors.Join
func GetMany(projectNames ...string) ([]Project, error) {
	var (
		allProjects = Find()
		projects    = []Project{}
	)

	for _, projectName := range projectNames {
		var found = false
		for _, project := range allProjects {
			if project.Name == projectName {
				projects = append(projects, project)
				found = true
				break
			}
		}

		if !found {
			return projects, fmt.Errorf("could not find project %s", projectName)
		}
	}

	return projects, nil
}
