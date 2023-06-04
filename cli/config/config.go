package config

import (
	"reflect"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"

	"k8s-lab.local/logging"
)

var log = logging.Log

const (
	defaultBootstrapGroupName = "bootstrap"
)

type WaitFor struct {
	Namespace string
	Condition string
	Resource  string
}

type ProjectOptsConfig struct {
	Name    string    `mapstructure:"name"`
	WaitFor []WaitFor `mapstructure:"wait_for"`
}

type BootstrapGroupProject struct {
	Name    string    `mapstructure:"project"`
	WaitFor []WaitFor `mapstructure:"wait_for"`
	Stack   string    `mapstructure:"stack"`
}

func bootstrapGroupProjectDecodeHook(
	from reflect.Type, // data type
	to reflect.Type, // target data type
	data interface{}, // raw data
) (interface{}, error) {
	if from.Kind() != reflect.Map || to != reflect.TypeOf(BootstrapGroupProject{}) {
		return data, nil
	}

	dataMap, ok := data.(map[string]interface{})
	if !ok {
		return data, nil
	}

	if _, ok := dataMap["stack"]; !ok {
		dataMap["stack"] = "prod"
	}

	// fmt.Printf("Kind: %+v | Type: %+v | Data: %+v\n", from.Kind(), to.Kind(), dataMap)

	return dataMap, nil
}

type Config struct {
	Cwd              string                             `mapstructure:"cwd"`
	Context          string                             `mapstructure:"context"`
	PulumiPassphrase string                             `mapstructure:"pulumi_passphrase"`
	Cluster          string                             `mapstructure:"cluster"`
	ProjectOpts      []ProjectOptsConfig                `mapstructure:"project_opts"`
	BootstrapGroups  map[string][]BootstrapGroupProject `mapstructure:"bootstrap"`
	ProjectRoots     []string                           `mapstructure:"project_roots"`
	SkipEncrypt      []string                           `mapstructure:"skip_encrypt"`
}

type BootstrapGroup struct {
	Name     string
	Projects []BootstrapGroupProject
}

func (cfg *Config) GetProjectOpts(projectName string) (ProjectOptsConfig, bool) {
	for _, projectOpts := range cfg.ProjectOpts {
		if projectOpts.Name == projectName {
			return projectOpts, true
		}
	}

	return ProjectOptsConfig{}, false

}

func (cfg *Config) GetBootstrapGroup(groupName string) (BootstrapGroup, bool) {
	if projects, ok := cfg.BootstrapGroups[groupName]; ok {
		bsg := BootstrapGroup{Name: groupName, Projects: projects}
		return bsg, true
	}

	return BootstrapGroup{}, false
}

func Init() {
	viper.SetEnvPrefix("LABBY")
	viper.SetConfigName(".labcoat")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./")

	viper.SetDefault("cluster", "lab")
	viper.SetDefault("context", "k3d-lab") // TODO: Use cluster name
	viper.SetDefault("cwd", ".")

	viper.AutomaticEnv()

	err := viper.ReadInConfig()
	if err != nil {
		switch e := err.(type) {
		case viper.ConfigFileNotFoundError:
			log.Warn("%+v\n", e)
		default:
			log.Fatalf("%+v\n", e)
		}

		return
	}

	log.Infof("Using config file: %s", viper.ConfigFileUsed())
}

// Get returns a memoized Config object that is loaded on first usage.
// Any subsequently calls return the same Config object.
var Get = func() *Config {
	var (
		loaded = false
		config = &Config{}
	)

	if !loaded {
		err := viper.Unmarshal(
			config,
			viper.DecodeHook(
				mapstructure.ComposeDecodeHookFunc(
					bootstrapGroupProjectDecodeHook,
					mapstructure.StringToTimeDurationHookFunc(),
					mapstructure.StringToSliceHookFunc(","),
				),
			),
		)

		if err != nil {
			log.Fatal(err)
		}

		loaded = true
	}

	return config
}
