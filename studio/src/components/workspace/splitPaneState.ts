/** Describes a split in the editor pane.
 *
 * The component that used to live here hand-rolled its own pointer-drag resize.
 * `WorkspaceLayout` renders the split as a nested `PanelGroup` instead (Phase 7),
 * so only the shape survived. `splitRatio` is likewise vestigial: pane sizes are
 * persisted by react-resizable-panels under its own `autoSaveId`, not carried
 * here, and it is kept only so existing state and any serialised workspace
 * session still parse.
 */
export interface SplitPaneState {
  id: string
  direction: 'horizontal' | 'vertical'
  /** @deprecated Pane sizes live in the panel group's own saved layout. */
  splitRatio: number
  firstPane: string | null
  secondPane: string | null
}
