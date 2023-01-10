<!-- Icon component-->

<script>
    export let name = "person";  // default: person icon
    export let size = 32;        // default: 32px

    // parse string sizes into css size
    if (isNaN(size)) {
        switch(size){
            case "tiny":
                size = "1rem";
                break;
            case "small":
                size = "2rem";
                break;
            case "medium":
                size = "4rem";
                break;
            case "large":
                size = "6rem";
                break;
        }
    } else {
        size += "px";
    }
</script>

<i class="material-icons" style="font-size: {size};">{name}</i>

<style>
    /* Make sure icons cannot be selected */
    i {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    /* This is needed for some mobile phones to display the Google Icon font properly */
    .material-icons {
        text-rendering: optimizeLegibility;
        -webkit-font-feature-settings: "liga";
        -moz-font-feature-settings: "liga";
                font-feature-settings: "liga";
    }
</style>