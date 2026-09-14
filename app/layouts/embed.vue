<!-- Bare layout for iframe-embedded views: no site header/navigation.

     overflow-x-hidden guards the iframe height contract: any horizontal overflow
     (e.g. the hero's wide logo lockup at some frame widths) would add a
     horizontal scrollbar, and the scrollHeight we report to the parent
     (useIframeEmbedHeight) excludes that scrollbar — so the frame gets sized ~a
     scrollbar too short and clips its bottom row. Suppressing the x-scroll keeps
     the reported height honest. -->
<template>
  <div class="overflow-x-hidden bg-default text-default">
    <slot />
  </div>
</template>
