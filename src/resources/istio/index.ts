import { local } from "@pulumi/command";

const istioSetup = new local.Command("istio-setup", {
  create: `istioctl `,
});
