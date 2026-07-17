# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable Prototype Decisions

- The main navigation includes a module named “采集站管理”, implemented in the existing 智能运维OS light enterprise visual system.
- The `采集站管理` module must follow the RH830-V2 Axure reference at `http://192.168.2.39/PQSP7L/?id=gqwtqd&p=rh830-v2&g=1`: station tree, dense configuration header/tabs, algorithm binding workspace, and visible-light annotation panel are the source of truth.
- RH830 station lists expose separate fuzzy filters for station code and station name, and each row presents code with its station name.
- RH830 algorithm annotation is the only substantially extended configuration tab: data ID is a searchable single-select over bound devices and descendant points; monitoring functions are required grouped cascading multi-selects; existing bindings stay selected and locked; binding merges functions by creation order.
- RH830 algorithm cards support data-group collapse, group/function deletion confirmation, parameter editing, annotation-region editing and color changes, optional monitoring-location descriptions, per-function annotation visibility, and a no-annotation state. The visible-light toolbar keeps its existing image operations with 截取快照 moved to the left.
- The main navigation includes a module named “音视频分析”, based on the 通用分析 design with a measurement-point tree, filter controls, synchronized trend charts, and audio/video joint analysis.
- For “音视频分析”, the provided 通用分析 page is the source of truth: preserve its fixed diagnostic-workbench density and do not replace it with dashboard summary cards or a large media-preview layout.
- “音视频分析” requirements: default to the latest 15 days and cap queries at 30 days; group associated metrics and select all by default; charts adapt when only one or two metrics are visible; point styling distinguishes no attachment, attachment, and alarm; selected points show millisecond timestamps, values, and alarm resolution context; provide collapsible onsite attachments, the specified chart context menu, waveform analysis, and a default automatic query with a manual confirm action.
- The OS analysis framework no longer separates “常规分析” and “精密分析”; present compatible analysis capabilities under “通用工具”, using a three-column workspace with the device tree on the left, tool switching and charts in the center, and time range, node/metric selection, data list, and the final “确定” action on the right.
- The “音视频分析” module must stay scoped to audio/video analysis only: do not expose 单趋势、多趋势, or unrelated analysis-tool entries inside this module. Its right operation panel is drag-resizable, and the selected point’s image attachment is expanded and shown directly by default.
