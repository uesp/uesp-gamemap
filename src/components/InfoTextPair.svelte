<!-- @component
### Description
 Info text pair component for the UESP gamemap.

 ### Author(s)
- Thal-J <thal-j@uesp.net> (28th March, 2023) -->

<script>
    export let name = "Info:";
    export let value = "Value";
</script>

<markup>
    <div>
        <span class="key">
            <b>{name}:</b>
        </span>

        <span class="value">
            {value}
        </span>

    </div>
</markup>

<style>
    div {
        width: 100%;
        display: flex;
        padding-top: 4px;
        font-size: 14px;
    }

    .key {
        color: var(--primary_dark_variant);
    }

    .value {
        text-align: end;
        align-self: end;
        display: inline-flex;
        place-self: end;
        align-content: end;
        margin-left: auto;
        min-width: 40%;
    }

</style>