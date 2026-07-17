# 音视频分析框架 Design QA

**Comparison target**

- Source visual truth: `analysis-source-desktop.png` (通用分析 Axure capture), supplemented by the attached OS analysis-framework PRD requiring unified “通用工具” and a left-tree / center-chart / right-operation three-column layout.
- Implementation screenshot: `audio-video-framework-desktop.png`.
- Responsive evidence: `audio-video-framework-mobile.png`.
- Viewports: 1440 × 1000 desktop; 500 × 844 narrow viewport.
- State: default audio/video measurement point, latest 15 days, all four associated metrics selected, onsite attachment collapsed, alarm sample selected.
- Full-view comparison: `audio-video-framework-comparison.png`.
- Focused chart-density comparison: `audio-video-framework-focused-comparison.png`.

**Findings**

- No remaining actionable P0, P1, or P2 findings.
- Typography: the implementation retains the source’s Microsoft YaHei/PingFang fallback stack, compact 12 px workbench scale, restrained weights, single-line truncation, and millisecond timestamps. The new right-panel hierarchy remains legible without introducing dashboard-style display typography.
- Spacing and layout: source tree and chart density are preserved. The PRD-directed right operation panel now owns time range, selected node, grouped metrics, data list, reset, and confirm actions. The three columns remain aligned and the chart viewport no longer introduces its own horizontal scrollbar at desktop width.
- Colors and tokens: neutral gray surfaces, blue active/tool states, green measurement-point icons, red alarm points, filled blue attachment points, and open blue no-attachment points match the source diagnostic language.
- Image quality and assets: the default view has no decorative raster imagery. Onsite attachment states use the existing real warehouse/conveyor imagery with correct cover treatment; Tabler icons are used consistently instead of custom SVG/CSS substitutes.
- Copy and content: “常规分析/精密分析” is replaced by “通用工具”; the selected audio/video point defaults to “音视频通用分析”; query guidance states latest 15 days and maximum 30 days; node, metric grouping, data status, alarm context, and attachment labels are coherent.
- Icons and affordances: tool tabs, favorite state, help, cursor, reset zoom, fullscreen, tree disclosure, attachment rail, data status, and right-side actions have consistent icon weight and visible active/hover states.
- Responsiveness: desktop content fits the available OS workspace. The 500 px viewport intentionally preserves the dense desktop workbench inside the existing horizontal workspace scroller; no controls overlap or render outside the scrollable surface.
- Accessibility: icon-only controls have accessible labels or titles, inputs are label-associated, images have alt text, and semantic buttons are used for selectable rows and actions. No reduced-motion-sensitive animation was introduced.

**Comparison history**

1. Initial three-column pass found one P2 layout issue: the center chart retained the old 580 px minimum width after adding the right operation panel, creating a small nested horizontal scrollbar and clipping the right edge of event annotations.
2. Fix: reduced the framework-specific chart minimum width to 520 px, tightened chart-header gaps, and widened the data-table status column to prevent header wrapping.
3. Post-fix evidence: `audio-video-framework-desktop.png` and `audio-video-framework-focused-comparison.png` show the entire chart width and right-edge annotations within the center column, with no nested chart scrollbar.

**Primary interactions tested**

- Default load: four grouped metrics selected; 15-day date range; eight latest data rows.
- Tool adaptation: 音视频通用分析 → 单趋势 produces one chart; 多趋势 restores four charts.
- Validation: a range over 30 days displays “时间范围最大允许选择30天”.
- Chart context menu: all 11 specified actions render.
- Data list selection expands the matching onsite attachment.
- A decibel waveform point opens the 关联波形分析 modal.
- Narrow viewport keeps the three-column workbench available through the existing horizontal scroll container.
- Browser runtime/network failures: 0.
- Production build: passed.

**Follow-up polish**

- P3: if a future release targets phones as a first-class platform, add a dedicated compact navigation pattern for switching among tree, chart, and operation panels instead of relying on the desktop workspace scroller.

**Implementation checklist**

- [x] Unified analysis tools under 通用工具.
- [x] Three-column OS analysis framework.
- [x] Right-side time, node, metric, data-list, reset, and confirm flow.
- [x] Existing audio/video trend, alarm, attachment, and waveform behaviors retained.
- [x] Desktop and narrow-viewport visual verification completed.
- [x] Interaction and production-build checks passed.

final result: passed
