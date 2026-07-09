export default defineAppConfig({
  ui: {
    // The dashboard components ship sized to the full viewport (`fixed
    // inset-0` group, `min-h-svh` sidebar/panel). The dashboard layout places
    // the group below the site header instead, so size the group as a flex
    // child of the layout column and let the sidebar/panel stretch to the
    // group's height rather than the viewport's — otherwise they overflow the
    // bottom by exactly the header height.
    dashboardGroup: {
      base: "relative flex-1 min-h-0 flex overflow-hidden",
    },
    dashboardSidebar: {
      slots: {
        root: "min-h-0",
      },
    },
    dashboardPanel: {
      slots: {
        root: "min-h-0",
      },
    },
  },
});
