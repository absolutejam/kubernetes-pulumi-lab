package kubectlwaitforopts

type Opts struct {
	Context   string
	Namespace string
	Condition string
	Timeout   string
	Resource  string
}
