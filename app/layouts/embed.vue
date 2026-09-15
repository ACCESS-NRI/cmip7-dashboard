<!-- Bare layout for iframe-embedded views: no site header/navigation.

     overflow-x-clip guards the iframe height contract: any horizontal overflow
     (e.g. the hero's wide logo lockup at some frame widths) would add a
     horizontal scrollbar, which the reported height (useIframeEmbedHeight) can't
     see — so the frame gets sized ~a scrollbar too short. clip (not hidden)
     because overflow-x: hidden forces overflow-y to compute as auto, which can
     itself introduce a spurious vertical scrollbar; clip suppresses the x-scroll
     without turning the wrapper into a scroll container. -->
<template>
  <div class="overflow-x-clip bg-default text-default">
    <slot />
  </div>
</template>
