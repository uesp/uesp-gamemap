<!-- Icon component-->

<script>
    export let name = "person";  // default: person icon
    export let size = 32;        // default: 32px

    // parse string sizes into css size
    if (!isNaN(size)) {
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

        console.log(size);
    }
</script>

<i class="material-icons" style="font-size: {size};">{name}</i>