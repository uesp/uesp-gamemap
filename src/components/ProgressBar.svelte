<!-- Progressbar component -->

<div class="progress_bar">
    <div class="progress"><div class="indeterminate"></div></div>
</div>

<style>

    .progress {
        position: relative;
        height: 4px;
        display: block;
        width: 100%;
        background-color: #acece6;
        border-radius: 2px;
        margin: 0.5rem 0 1rem 0;
        overflow: hidden;
    }

  .progress .indeterminate {
    background-color: #26a69a;
  }
  .progress .indeterminate:before {
    content: "";
    position: absolute;
    background-color: inherit;
    top: 0;
    left: 0;
    bottom: 0;
    will-change: left, right;
    -webkit-animation: indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
            animation: indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
  }
  .progress .indeterminate:after {
    content: "";
    position: absolute;
    background-color: inherit;
    top: 0;
    left: 0;
    bottom: 0;
    will-change: left, right;
    -webkit-animation: indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
            animation: indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    -webkit-animation-delay: 1.15s;
            animation-delay: 1.15s;
  }

  @-webkit-keyframes indeterminate {
    0% {
      left: -35%;
      right: 100%;
    }
    60% {
      left: 100%;
      right: -90%;
    }
    100% {
      left: 100%;
      right: -90%;
    }
  }

  @keyframes indeterminate {
        0% {
        left: -35%;
        right: 100%;
        }
        60% {
        left: 100%;
        right: -90%;
        }
        100% {
        left: 100%;
        right: -90%;
        }
    }
  @-webkit-keyframes indeterminate-short {
        0% {
            left: -200%;
            right: 100%;
        }
        60% {
            left: 107%;
            right: -8%;
        }
        100% {
            left: 107%;
            right: -8%;
        }
  }
  @keyframes indeterminate-short {
        0% {
            left: -200%;
            right: 100%;
        }
        60% {
            left: 107%;
            right: -8%;
        }
        100% {
            left: 107%;
            right: -8%;
        }
  }

    .progress_bar {
        top: -9px;
        width: 100%;
        position: relative;
        z-index: 9999;
        opacity: 0.85;
        pointer-events: none;
    }

    .progress {
        background-color: var(--secondary) !important;
        box-shadow: 0 2px 2px 0px var(--shadow);
    }

    .progress .indeterminate {
        background-color: var(--secondary_variant) !important;
    }
</style>
