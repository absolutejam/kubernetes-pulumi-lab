// *** WARNING: this file was generated by crd2pulumi. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as utilities from "../../utilities";

import {ObjectMeta} from "../../meta/v1";

export class Kiali extends pulumi.CustomResource {
    /**
     * Get an existing Kiali resource's state with the given name, ID, and optional extra
     * properties used to qualify the lookup.
     *
     * @param name The _unique_ name of the resulting resource.
     * @param id The _unique_ provider ID of the resource to lookup.
     * @param opts Optional settings to control the behavior of the CustomResource.
     */
    public static get(name: string, id: pulumi.Input<pulumi.ID>, opts?: pulumi.CustomResourceOptions): Kiali {
        return new Kiali(name, undefined as any, { ...opts, id: id });
    }

    /** @internal */
    public static readonly __pulumiType = 'kubernetes:kiali.io/v1alpha1:Kiali';

    /**
     * Returns true if the given object is an instance of Kiali.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is Kiali {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === Kiali.__pulumiType;
    }

    public readonly apiVersion!: pulumi.Output<"kiali.io/v1alpha1" | undefined>;
    public readonly kind!: pulumi.Output<"Kiali" | undefined>;
    public readonly metadata!: pulumi.Output<ObjectMeta | undefined>;
    /**
     * Kialis CRD fields
     */
    public readonly spec!: pulumi.Output<{[key: string]: any} | undefined>;

    /**
     * Create a Kiali resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: KialiArgs, opts?: pulumi.CustomResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            resourceInputs["apiVersion"] = "kiali.io/v1alpha1";
            resourceInputs["kind"] = "Kiali";
            resourceInputs["metadata"] = args ? args.metadata : undefined;
            resourceInputs["spec"] = args ? args.spec : undefined;
        } else {
            resourceInputs["apiVersion"] = undefined /*out*/;
            resourceInputs["kind"] = undefined /*out*/;
            resourceInputs["metadata"] = undefined /*out*/;
            resourceInputs["spec"] = undefined /*out*/;
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(Kiali.__pulumiType, name, resourceInputs, opts);
    }
}

/**
 * The set of arguments for constructing a Kiali resource.
 */
export interface KialiArgs {
    apiVersion?: pulumi.Input<"kiali.io/v1alpha1">;
    kind?: pulumi.Input<"Kiali">;
    metadata?: pulumi.Input<ObjectMeta>;
    /**
     * Kialis CRD fields
     */
    spec?: pulumi.Input<{[key: string]: any}>;
}