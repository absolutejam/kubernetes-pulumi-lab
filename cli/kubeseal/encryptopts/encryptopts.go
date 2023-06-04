package encryptopts

type Opts struct {
	Context             string
	ControllerName      string
	ControllerNamespace string
	AllowEmptyData      bool
	Format              string
	InputFile           string
	OutputFile          string
}
