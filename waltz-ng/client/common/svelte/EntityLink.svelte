<script>
    import ViewLink from "./ViewLink.svelte";
    import EntityLabel from "./EntityLabel.svelte";
    import {kindToViewState} from "../link-utils";

    /**
     * Entity Link takes an entity ref
     * and generates a page link for the entity.
     * By default it will render an icon and the name of the
     * entity (if it's on the reference).
     *
     * If the default slot is provided then that will be used.
     *
     * @type {{id: number}}
     */

    export let ref = {};
    export let isSecondaryLink = false;

    let state = null

    $: {
        try {
            state = kindToViewState(ref.kind);
        } catch(e){
            console.log(e);
        }
    }

</script>

<ViewLink {state} {isSecondaryLink}
          ctx={ref}>
    {#if $$slots.default}
        <slot/>
    {:else}
        <EntityLabel {ref}/>
    {/if}
</ViewLink>
