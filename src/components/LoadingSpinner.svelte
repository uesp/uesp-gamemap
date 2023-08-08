<!-- @component
### Description
 Loading spinner component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Jan, 2023) -->

<script>
  export let size = "140px";
</script>

<div class="spinner" style="height: {size};">
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="20" />
  </svg>
</div>

<style>
.spinner {
  width: auto;
  overflow: clip;
}

.spinner svg {
  animation: rotate 1.5s linear infinite;
  height: 100%;
  width: 100%;
}

.spinner circle {
  stroke-dasharray: 1,200;
  stroke-dashoffset: 0;
  animation:
    dash 1.5s ease-in-out infinite 0s,
    color 6s ease-in-out infinite -0.75s;
  stroke-linecap: round;
  fill: none;
  stroke-width:3;
  stroke: var(--secondary_variant);
}

@keyframes rotate {
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1,200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89,200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89,200;
    stroke-dashoffset: -124;
  }
}
</style>