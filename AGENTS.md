# Prototype Instructions

- “设备位置管理 / 添加缺陷”以用户提供的深蓝全屏缺陷登记界面为结构参考：打开后使用覆盖设备空间树内容区与中央画布的大尺寸缺陷工作面，但保留左侧窄空间结构操作栏和右侧五项功能舱；设备空间、中文测点、摄像机、设备路径、诊断记录与最新抓拍由当前上下文自动带入并只读展示，用户填写缺陷名称、等级、故障部件/类型、现象描述、诊断结论、检维修建议、责任班组、计划完成时间及补充附件。

- “设备位置管理”左侧设备空间树的窄操作栏必须保留，继续提供新增、剪切、复制、粘贴、重命名、上移、下移和删除空空间；该操作栏维护的是空间结构，不属于测点手工配置，不得因测点统一同步而删除。
- “设备位置管理”画布左下普通状态只保留一个“测点位置修改”入口；删除 3D、空间关系、空间文档和空间图设置按钮，不得留下空白分段。
- “设备位置管理”完全取消“区域 / 分区 / 测点分组”概念：空间树直接列出锅炉房、皮带机廊道、转运站、碎煤机室等独立小空间，平面图上不得出现区域虚线框、区域名称、区域选择、区域统计或分组编辑器。
- “设备位置管理”不提供测点新增、绑定、删除、摄像头选择、预置位选择或指标勾选；进入位置编辑态后只保留“保存位置、清除选中位置、取消编辑”三项。取消编辑必须恢复进入前的测点位置。
- “设备位置管理”的测点必须展示来自采集站目录的中文业务名称，不得把英文源 ID、摄像头编号或采集站编号作为测点名称暴露给用户；英文源 ID 仅用于内部同步、去重和关联。进入“测点位置修改”后，测点本体固定使用“状态色测点符号 + 中文测点名称”的紧凑标记卡，不得替换为长名称条、连线、红色圆形删除按钮或蓝色圆形加号。图面编辑态只改变工具栏和标记的可定位行为，不改变测点标记的基本视觉形态。
- “设备位置管理”的测点、摄像头、预置位、协议、状态和算法指标必须与“采集站管理”使用同一目录和同一标识；这些字段在位置管理中只读展示，不允许用户重复配置。位置管理只保存设备空间、平面图和测点坐标，一台摄像头关联多个测点的关系直接继承采集站管理。
- “设备位置管理”的测点详情不得用步骤条、重复的“继承 / 同步 / 只读”标签过度强调数据来源；以测点信息、巡检指标和空间位置为主。详情中必须提供“前往采集站管理”按钮，携带采集站、摄像头和源测点 ID，直接定位到采集站管理中的对应测点，不得只跳到模块首页。
- “设备位置管理”的测点详情必须实时展示每个巡检指标的具体结果，不能只显示指标名称：温度、压力、偏移量、声压级等数值型指标显示当前值、单位、阈值/趋势和更新时间；仪表识别、人员闯入、烟火、滴漏等视觉指标显示最新抓拍、识别结论、置信度和更新时间。结果随当前测点切换并持续刷新。

- “设备位置管理”现采用用户提供的深蓝工业数字孪生界面作为完整重做的视觉基准：使用深蓝/青蓝发光配色、左侧窄工具轨道与设备空间树、中央沉浸式 2D 平面图主画布、右侧蓝黑测点配置舱；不得再回退为浅色企业后台三栏界面或仅在旧界面上换皮。
- “设备位置管理”不使用跨空间的厂区全貌图；锅炉房、皮带机廊道、转运站、碎煤机室等每个设备空间各自维护一张独立的小范围底图和自己的测点集合，底图应只覆盖当前单一空间及其紧邻检修通道。切换设备空间必须同步切换底图、测点、统计和右侧配置上下文，未配置底图的空间显示独立上传入口且不得继承其他空间图。
- “设备位置管理”的锅炉房底图必须是真正正交俯视的工程平面布置图，清晰表现锅炉本体、烟风管道、检修平台、楼梯、门和通道；不得使用锅炉正立面、剖面、轴测透视或概念渲染图冒充平面图，底图本身不得包含测点、区域框、文字或 UI。
- “设备位置管理”的页面结构保持深蓝工业数字孪生视觉：左侧为设备空间树，中间为当前单一设备空间图，测点详情按需覆盖展开。顶部固定保留“设备空间图 / 位置信息 / 测点清单”三个任务页签；位置信息不得再次删除。
- “设备位置管理”加载和刷新时自动读取“采集站管理”共用的摄像头—测点目录，通过内部规则映射到具体设备空间；界面不得暴露区域筛选或“自动增加测点”按钮。同步必须继承摄像头、型号、IP、协议、状态、预置位和算法指标，同时保留已有空间坐标并按源测点去重。
- “设备位置管理”进入测点位置编辑态后，测点标记必须支持在平面图上按住直接拖动并实时跟随，松开即更新坐标；点击后再点击图面定位仍保留，取消编辑必须恢复拖动前的位置。
- “设备位置管理”右侧固定保留“诊断分析 / 添加缺陷 / 诊断记录 / 设备履历 / 设备图片”五项深蓝功能舱及竖排 `CONCEAL` 折叠把手；功能舱可折叠并在折叠后把宽度归还中央画布，但不得删除。
- “设备位置管理”的竖排 `CONCEAL / REVEAL` 把手在所有桌面宽度和缩放比例下都必须完全内收于右侧功能舱自身边界，禁止使用负 `left`、外置悬浮或详情与功能舱之间的额外把手占位；测点详情、设备履历及其他功能面板的右边界直接与功能舱左边界相接。功能舱折叠后仅保留 32px 内置恢复边，详情和持久底部操作必须同步避让，不得被恢复边覆盖。

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable Prototype Decisions

- “设备位置管理”面向客户直观展示时，默认底图采用简化数字孪生工程平面风格：严格正交俯视，以低饱和钢蓝设备块面和克制青蓝轮廓突出主要设备、主干管路、平台、楼梯、门及检修通道；删除螺栓、密集网格、细小阀件和重复构造线等微观 CAD 细节，底图不得包含文字、测点、区域框或 UI，并在视觉层级上主动弱于测点状态标记。

- “采集站管理”所有一级工作区、配置页签、设备接入/状态监控、右侧抽屉、菜单、弹窗和交付检查统一使用同一套深蓝工业主题与青蓝强调色，不得混入浅色页面或局部白色卡片。

- “采集站管理 / 算法标注”的可见光标注工具栏固定提供点标注、矩形线框标注、多点线框标注、编辑标记、放大、缩小、冻结和解锁八项独立动作；冻结与解锁不得合并为语义不明的单一切换按钮，当前工具、禁用状态和执行反馈必须清晰可见。
- “采集站管理 / 算法标注”的多点线框必须支持在画面中逐点落点，至少 3 个顶点，点击起点、双击或按 Enter 闭合，Backspace 撤销最后一点，Esc 取消未完成绘制；顶点使用归一化坐标随算法草稿保存，编辑弹窗与主预览使用同一组顶点，不得用固定五边形或包围框冒充。

- “设备位置管理”的左侧设备空间栏支持拖拽和键盘调宽、双击恢复默认宽度，并持久化用户宽度；收起时仅隐藏设备空间树并把宽度归还中央画布，窄结构操作栏及其新增、剪切、复制、粘贴、重命名、上移、下移和删除能力必须继续保留，同时提供清晰的展开恢复入口。

- “采集站管理 / 算法标注”的数据 ID 选择严格采用“设备分组 → 组内测点”的单选逻辑：设备 / 摄像头行仅作为分组标题，不可成为数据 ID；只能选择其下级测点。搜索测点或完整路径时仅保留匹配项；“已绑定”与“当前选择”是独立状态，已绑定测点仍可重新选择，并在锁定已有监测功能的同时继续追加新的监测功能。
- 上述“设备分组 → 组内测点”逻辑必须落在海康摄像机设备族上；RH830 参考图只用于说明数据 ID 选择与绑定交互，不得把最终实现目标切换成 RH830。海康摄像机作为设备分组，巡检测点作为其下级数据 ID。
- 海康设备接入的当前采集站组织树需要提供足量的真实设备样本，不得长期只保留 3 台基线摄像机；锅炉站至少覆盖固定可见光、云台可见光、红外热成像以及炉顶、燃烧器层、磨煤机层、空预器出口和送风机层等典型巡检位置，并同步驱动树数量、设备表、筛选和算法标注入口。

- “采集站管理”中的巡检点就是已有测点的业务别名，不得再提供独立的“创建巡检点”入口或三段式创建弹窗；算法标注直接选择摄像头下已有测点并绑定算法指标、检测区域、位置描述和必要的取景/预置位信息。

- “采集站管理”的资产层级固定为“区域 → 采集站 → 摄像头 → 测点（巡检点） → 算法指标”：锅炉区域、输煤区域等区域的直接子级必须是采集站；采集站编码、采集站名称与状态是站级字段，摄像头只能归属某个采集站，不再维护重复的安装区域或安装点位字段。
- “采集站管理 / 设备接入”的摄像头必须归属于唯一采集站，采集站切换真实隔离设备清单、组织树、交付计数、页面草稿、巡检点和算法绑定；设备抽屉中的所属区域、采集站编码和采集站名称为只读上下文，新增和批量导入设备自动归属当前采集站，跨站算法跳转必须阻止并说明原因。
- “采集站管理 / 算法标注”从设备接入深链进入时必须保持单一设备上下文：采集站、当前摄像机、巡检点、算法卡与右侧预览的名称、IP、型号和画面必须一致；数据 ID 选择器与算法组仅展示当前摄像机及其下级巡检点，不得混入站内其他设备。无设备深链时才允许展示当前站点的完整设备分组。

- “采集站管理 / 设备接入”以交付阻塞为默认决策线索：页签区持续展示当前范围的就绪数、阻塞数与阻塞原因，并提供“处理下一个阻塞项”直达动作；空的跨模块关联事件条不占用工作区。
- “采集站管理 / 设备接入”的交付就绪必须同时验证基础信息、设备连接、视频取流、算法接入与巡检点关联；顶部交付决策条支持按阻塞原因直接筛选，并提供可导出的交付检查单与设备级定位。列表删除恒定为 1 的独立通道列，将通道并入设备摘要；刷新只保留在“更多”操作中。
- “采集站管理 / 设备接入”删除重复的状态统计与状态筛选入口，状态筛选统一在设备筛选区完成；全局算法标注入口收敛到具体设备行或设备抽屉，刷新、批量检测、指标同步与导出统一收进“更多”操作。
- “采集站管理 / 设备接入”不再把采集站列表与接入状态监控拆成两个视图；统一设备列表直接展示交付状态、阻塞原因、算法绑定与定位配置动作，阻塞设备以行级语义高亮，顶部交付摘要负责跨列表定位。
- “采集站管理 / 算法标注”的数据 ID 选择器采用设备分组、组内测点的紧凑层级；顶部持续展示当前设备与测点数量，搜索支持名称和完整路径；“已有配置”与“当前选择”必须使用不同语义，已有配置项仍可选择并追加监测功能。

- The prototype's operating context is thermal power plant inspection. All visible organizations, areas, devices, measurement points, alarms, evidence media, and sample paths must use thermal-power-plant semantics (such as boiler, turbine, coal handling, transfer station, coal conveyor, crusher house, desulfurization, and electrical systems); do not introduce test/demo labels or mining, coal-preparation-plant, warehouse, logistics, or generic production-line scenarios.

- The main navigation includes a module named “设备位置管理”, implemented in the existing 智能运维 OS light enterprise visual system.
- “设备位置管理”以设备空间树承载音视频巡检测点；每个设备空间图独立支持上传 2D 平面图、放置/重新定位该空间的测点标记，并为每个测点选择音视频设备、预置位和巡检指标，保存后的空间与指标关系用于后续空间详情展示。
- “设备位置管理”不提供巡检测点绑定表单；采集站管理新增、删除或调整测点后，位置管理通过自动同步和“刷新同步”更新只读清单，用户仅处理未定位测点。
- “设备位置管理”区分页面草稿与已保存配置：上传平面图、绑定/删除测点、清空或移动标记均产生未保存状态，支持整页撤销、离页保护、本地恢复和 JSON 配置导出；大尺寸平面图无法持久化时必须给出明确反馈。
- “设备位置管理”选择任一设备空间后必须真实限定平面图、测点和右侧空间概览范围；从标记进入测点编辑时保留当前空间上下文。
- “设备位置管理”采用“平面图—测点绑定—空间定位—配置可用”四步配置完整度；保存前必须执行可恢复的阻塞检查，缺少平面图、测点、定位或巡检指标时定位到具体处理对象，警告项不得伪装为已完成。
- “设备位置管理”必须提供位置详情预览，按当前环境一次性展示平面图、测点清单、关联指标、设备和状态，作为空间与指标关系的验收视图；紧凑桌面高度下编辑器底部操作和绑定表格操作列始终可见。
- “设备位置管理”严格限定为空间配置模块，不承载巡检路线、执行顺序、测点启停、停留时长或任务调度；以上智能巡检策略统一在独立“智能巡检管理”界面维护。
- “设备位置管理”顶部不再提供“均衡布局 / 画布优先 / 配置优先”布局切换，固定采用画布为主的响应式比例；在 1440px 工作区优先保证中央平面图约占一半以上，并在更宽桌面把主要增量继续分配给画布。

- 采集站管理需要在保留 RH830 配置基线的同时支持海康可见光、红外、云台/非云台摄像机设备族；海康站点须明确展示型号、媒体类型、控制能力、接入协议与视频流状态。
- 海康设备通过算法标注选择并绑定摄像头下已有测点，海康原生算法指标直接绑定到测点；具备云台能力的设备在标注预览中提供实时旋转、变焦、聚焦和预置位控制，不具备能力或离线时需显示明确原因。
- “采集站管理 / 算法标注”不得提供“创建海康算法巡检点”按钮或创建弹窗；测点由既有设备数据提供，算法标注只负责选择测点、绑定指标和配置取景标注。
- “采集站管理 / 算法标注”中每一个海康测点独立保存自己的云台水平角、俯仰角、光学变焦、数字变焦和预置位；切换测点必须恢复该测点的取景状态，调整后写入当前采集站页面草稿，不得让同一摄像头下的多个测点共用一份临时云台状态。
- 海康设备接入工作区以用户提供的“采集站管理”参考图为结构基线：左侧组织/设备树，中间为设备清单、视频流缩略图、云台能力与算法绑定，右侧使用“视频接入 / 控制能力 / 算法指标”三页编辑抽屉；保留新增、批量导入、刷新、筛选、分页和集成状态反馈。
- 海康设备接入的内部组织树必须提供足够的火电区域范围，不得只展示单一锅炉区域；默认覆盖锅炉、汽机、输煤、脱硫和电气区域，各区域下挂真实采集站与海康摄像机样例，区域展开、采集站切换、设备清单、数量和搜索结果保持同步。

- 智慧视频监控、智能诊断、音视频分析和采集站管理必须围绕同一业务事件联动：跨模块传递统一事件主键、设备/位置、摄像机、采集站、测点、指标与报警时刻；处置状态、缺陷编号和处置说明在四个模块中保持一致，并提供可恢复的相互跳转入口。
- 四模块联动不得使用全局固定事件或只切换模块首页；跳转入口必须由当前报警/病例生成，一条报警对应唯一事件记录，并自动定位到该事件的摄像机画面、诊断病例、分析测点与指标、采集站配置。

- 智能运维 OS 的全局顶部栏采用 42px 极致紧凑高度，为诊断与配置工作区释放更多纵向空间；品牌、通知和账户控件同步压缩，但仍保留清晰焦点与可点击区域。
- 全局框架不再显示“主页 / 当前模块”已打开页面标签行；所有模块直接进入内容工作区。

- On desktop, the left navigation uses a balanced compact 188px default width with a 168–236px adjustable range, and fully retracts off-canvas instead of leaving a compact icon rail; the workspace expands to the left edge and a visible restore button remains available.

- The main navigation includes a module named “采集站管理”, implemented in the existing 智能运维OS light enterprise visual system.
- The `采集站管理` module must follow the RH830-V2 Axure reference at `http://192.168.2.39/PQSP7L/?id=gqwtqd&p=rh830-v2&g=1`: station tree, dense configuration header/tabs, algorithm binding workspace, and visible-light annotation panel are the source of truth.
- 海康设备接入使用独立一级配置工作区；进入时自动收起外层采集站树并隐藏重复的监测设备标签行，组织范围直接驱动设备列表。右侧设备配置抽屉支持拖拽、键盘调宽、双击复位、收起恢复和宽度持久化，窄工作区采用覆盖层以保证设备列表仍是主工作面。
- 海康设备接入页不展示外层采集站树及其恢复把手，采集站切换统一使用顶部下拉框，页面仅保留内部组织/设备树；离开设备接入页后才恢复站级树入口。设备抽屉的“应用到页面草稿”和页面顶部“保存平台版本”必须显式区分，列表、计数、分页、批量选择、连接测试和未应用修改保护均需真实可演示。
- 海康“接入状态监控”必须按交付阻塞优先展示真实就绪数量、阻塞原因和“定位配置”动作，不得与普通设备列表仅做文案切换。设备级未应用修改会阻止站点切换、一级页签切换、算法标注跳转和顶部保存；应用后的设备列表写入站点页面草稿并跨页签保留。算法标注的海康预览固定使用标题、工具栏、云台控制、16:9 画面四行结构，禁用绑定原因以内联说明呈现，不使用遮挡工作区的原生提示。
- RH830 station lists expose separate fuzzy filters for station code and station name, and each row presents code with its station name.
- RH830 algorithm annotation is the only substantially extended configuration tab: data ID is a searchable single-select over bound devices and descendant points; monitoring functions are required grouped cascading multi-selects; existing bindings stay selected and locked; binding merges functions by creation order.
- RH830 algorithm cards support data-group collapse, group/function deletion confirmation, parameter editing, annotation-region editing and color changes, optional monitoring-location descriptions, per-function annotation visibility, and a no-annotation state. The visible-light toolbar keeps its existing image operations with 截取快照 moved to the left.
- Every visible RH830 control must have a demonstrable interaction contract: popovers and menus close on outside click/Escape, commands respect online/offline state and lock against duplicate execution, feedback distinguishes success/info/warning/error, station dirty state is derived from each station's saved baseline with section-level markers, and users can explicitly undo all unsaved changes.
- RH830 annotation regions use stable IDs and normalized rectangle coordinates; region names, per-region colors, visibility, order, position, and size persist with the station draft. Annotated functions require at least one valid region unless explicitly set to 无需标注区域, and function-level visibility takes precedence over individual region visibility.
- RH830 海康算法标注的绑定状态说明独占表单次行，不得挤压操作按钮或覆盖算法卡；算法卡以“编辑标注”为高频主操作，删除功能收敛为带可访问说明的图标动作；右侧云台、变焦和预置位按预览栏自身宽度重排并保持完整可达。
- “采集站管理 / 设备接入”以用户提供的三栏基准图为视觉源：顶部仅保留模块标题和“采集站列表 / 接入状态监控”，左侧为单一组织设备树，中部为设备筛选表格，右侧为固定编辑抽屉；不得在该页叠加采集站配置头、板卡页签或第二套设备树。抽屉底部采用“取消 / 保存”，连接复测归入集成状态。
- “采集站管理 / 设备接入”桌面比例以设备表格为主：组织树 / 设备列表 / 编辑抽屉约为 15% / 54% / 31%；组织树保持紧凑，右侧抽屉宽度稳定，中栏通过更高设备行与同比例视频缩略图充分利用纵向空间。
- “采集站管理 / 设备接入”的设备操作区、筛选区、表格与编辑抽屉属于核心任务模块，桌面端应占据更大的可视面积；组织树进一步收敛为辅助栏，核心控件、设备行、视频缩略图和编辑表单采用更大的交付阅读密度，列表超出时仅在表格内部滚动。
- “采集站管理 / 设备接入”的放大密度必须依据工作区 CSS 宽度响应，不得假设 2048 物理像素等于 2048 CSS 像素；浏览器 100% 且 Windows 显示缩放为 125%–150% 时应自动回落到紧凑密度，不要求用户调低浏览器缩放。
- “采集站管理 / 设备接入”抽屉的“算法指标”页签必须展示平台可用的全部算法指标，包含设备原生指标与平台算法，不得仅展示海康原生指标；目录不使用固定业务模块或固定分组块，默认以统一动态清单呈现，通过搜索、指标来源和兼容状态筛选，并依据当前设备媒体能力明确区分已接入、可接入和机型不支持。
- “采集站管理 / 设备接入”的算法指标抽屉避免多层卡片、大块统计区和重复说明造成拥挤；兼容数量、已接入数量、同步状态和同步操作收敛到目录标题，筛选保持轻量，优先把纵向空间留给指标清单。
- “采集站管理 / 设备接入”的设备配置抽屉采用一体化展开/收起界面：收起后抽屉自身变为与工作区同高的右侧窄边栏，整条边栏可恢复展开；不得额外悬浮或叠加独立“打开设备配置”按钮，也不得覆盖设备表格、算法标注入口或其他行内操作。
- The RH830 prototype must remain fully demonstrable without backend services: preview debug, proxy/network editing, monitored-device association, all configuration-tab forms, self-check, save/dirty state, parameter issuing, reboot confirmation, snapshot/config/log downloads, and success/progress feedback are interactive frontend flows.
- RH830 product optimization prioritizes explicit station/runtime context and error prevention: status filtering and empty-result recovery stay visible; dirty station switches require save/discard/cancel; bound-device removal exposes blocking dependencies; algorithm binding is enabled only for genuinely new functions. Keep these protections inside the dense workbench instead of replacing it with dashboard cards.
- RH830 must distinguish page draft, platform-saved version, and device-running version at all times. Saving never implies device effect; configuration review exposes blocking items and changed sections, while parameter issue lets users either save-and-issue the draft or issue the last saved version without discarding the draft.
- RH830 asynchronous work is station-scoped and immediately mutexed: self-check results cannot leak across station switches, save-and-switch cannot submit twice, and Escape closes only the topmost confirmation layer. Annotation regions provide keyboard selection and bounded arrow-key movement, collision-safe IDs, local reset, and integer-aware parameter validation.
- At widths up to 1100px, the RH830 station tree behaves as a dismissible overlay drawer with a clear scrim and restore handle; the algorithm configuration and visual preview remain side by side at narrower widths instead of stacking vertically.
- “采集站管理”算法标注右侧可见光模块必须按工作区实际可用宽度响应，完整显示标题、工具栏、16:9 预览画面和右侧边界；算法配置与预览图片始终左右排列、不得改成上下排列，空间不足时通过列宽压缩、内部字段重排和模块内滚动保持完整可用。
- “采集站管理 / 设备接入”与“板卡集合 / 算法标注”采用设备级双向上下文跳转：入口必须携带采集站、摄像机、目标数据 ID/巡检点并定位到对应算法组；返回时恢复组织范围、筛选条件、选中设备、抽屉页签和列表滚动位置。无法解析关联测点时不得跳到默认数据组，而应留在设备接入页并定位到算法指标处理原因；过渡采用克制的短动画并兼容减少动态效果。
- “采集站管理”在浏览器 100% 且高 DPI/缩放后的常规办公屏（工作区宽度不超过 1450 CSS px）使用与原始交付参考图一致的紧凑密度：模块占位依靠三栏比例分配，不通过放大按钮、表格行、视频缩略图或表单控件实现；设备行约 76px、缩略图约 104×60px、表单控件约 28px，编辑抽屉约 420px，并确保算法绑定列在默认工作区可见。
- “采集站管理 / 板卡集合”的清洁设置与算法标注统一采用算法标注页的紧凑页面骨架：顶部使用站点摘要并按需展开站点详情，两级配置页签合并为同一横向导航轨道；各页仅在内容工作区保留自身任务结构。算法标注仍采用渐进展开，预览调试、配置检查、下达参数和保存为常驻高频动作，代理、网络、重启等低频命令收进“更多”。
- “采集站管理 / 算法标注”的海康巡检点上下文条与“数据 ID / 监测功能”绑定区采用极致紧凑密度，持续压缩标题栏、表单控件和状态说明的纵向占比，把更多工作区高度留给算法卡与右侧预览。
- RH830 属性 / 基本信息 must follow the Axure state exactly: six basic rows, collapsible 板信息 with eight columns and two board rows, followed by 采集站同步类型 and 最大通道数. When the secondary tab row is absent, the property body fills the remaining workspace height.
- The main navigation includes a module named “音视频分析”, based on the 通用分析 design with a measurement-point tree, filter controls, synchronized trend charts, and audio/video joint analysis.
- For “音视频分析”, the provided 通用分析 page is the source of truth: preserve its fixed diagnostic-workbench density and do not replace it with dashboard summary cards or a large media-preview layout.
- “音视频分析” requirements: default to the latest 15 days and cap queries at 30 days; group associated metrics and select all by default; charts adapt when only one or two metrics are visible; point styling distinguishes no attachment, attachment, and alarm; selected points show millisecond timestamps, values, and alarm resolution context; provide collapsible onsite attachments, the specified chart context menu, waveform analysis, and a default automatic query with a manual confirm action.
- “音视频分析”的证据附件位于趋势图右侧；设备树与分析条件均可独立收起，并保留清晰的恢复入口。
- “音视频分析”的证据附件支持拖动左侧分隔线左右调整宽度，键盘左右键可微调、双击可恢复响应式默认宽度，调整结果需持久化；收起时固定为窄栏并停用宽度拖拽，面板宽度不得挤占趋势图的基本可读空间。
- “音视频分析”的图片与视频证据必须随附件栏宽度按统一媒体比例同步增高，保持画面原始宽高比且不裁切；不得只横向拉宽。媒体卡高度由比例驱动，空间不足时仅允许证据卡列表内部纵向滚动。
- “音视频分析”证据栏调整宽度、附件类型变化或选中算法切换后，当前证据卡必须自动完整对齐到可视区；附件列表滚动按完整卡片吸附，不得在顶部停留被截断的半张证据卡。
- “音视频分析”的音频算法证据不得固定或脱离统一算法卡列表；音频卡与视觉卡按同一列表滚动，但必须保持完整、不可压缩的卡片高度，选中或滚动到音频算法时完整展示标题、波形、播放控制和同步状态。
- “音视频分析”证据附件展开后直接展示算法证据卡，不再重复显示内部“证据附件”标题、`n/n 有附件`统计或“采样时间 · 每种算法一张证据卡”说明；保留面板顶部唯一的收起/展开入口。
- “音视频分析”的证据附件按当前采样时刻一次性展示所有已应用算法，每种算法固定一张证据卡，并保持算法名称、读数、报警状态和附件类型一一对应；不再使用跨算法附件轮播。证据卡列表随可用高度收缩，默认四算法在支持窗口内应同时完整可见，低于可读下限后才允许列表内部滚动。
- “音视频分析”缺少附件时必须显示算法级具体原因（未触发抓拍/录音、设备离线、生成失败或附件已过期），原因与证据卡一一对应；不得再笼统显示“无附件”，报警但缺少媒体时也不得误标为“报警证据”。
- “音视频分析”应以有附件样本为主：绝大多数采样时刻全部算法均有附件，异常时刻也默认仅让对应算法缺失并保留其余算法证据，整体附件覆盖率保持在 90% 以上。
- “音视频分析”的查询范围必须真实驱动趋势横轴、点位毫秒时间、结果列表、证据时刻与导出数据；快捷范围采用今天/近7天/近15天/近30天并仅在精确匹配时激活，自定义范围需区分草稿与已应用结果，拦截未来日期、倒序、缺失和超过30天，并提供范围级撤销与明确的自动/手动查询反馈。
- “音视频分析”趋势图采用受控响应式比例：二值状态图最大宽度 920px、高度 140–220px，等级与连续数值图最大宽度 960px、高度 155–260px；单图和双图不再纵向拉满，SVG 绘图区随实际容器宽高同步，避免宽屏过长和窄屏近方形。
- “音视频分析”趋势点提示框必须依据点位与图表边界自动上下翻转并约束水平位置；活动图表可临时抬高层级让提示框完整越过绘图区，但不得被相邻图表裁切、遮挡或改变其他图表的实际绘制尺寸。
- “音视频分析”趋势图采用跨指标同步时间视窗：工具栏与 Ctrl/Command+滚轮可同步缩放且最少保留4个采样点，放大后支持拖拽平移，双击图面或按0恢复全览；普通滚轮必须继续用于多图纵向滚动。缩放和平移不能破坏趋势点、结果行与算法附件的一一同步，查询范围或测点切换后恢复完整时间视窗。
- “音视频分析”默认三/四图模式必须在标准工作区内完整露出最下方图表及横轴；多图高度由图表区的实际可用高度驱动，不得因设备树或 OS 导航收起后变宽而增高；空间低于可读下限时仅允许图表列表内部滚动，并保留底部安全间距。
- “音视频分析”内容卡必须严格占用扣除全局顶部栏和工作区上下留白后的真实可用高度，不得以 `height: 100%` 叠加父级内边距而延伸到视口外；趋势图横轴、四张证据卡和分析条件底部操作栏均需处于可视或各自内部可滚动区域。
- “音视频分析”中所有可见按钮都必须有真实结果或明确的禁用原因，并通过状态变化、进度、成功/失败提示或可恢复路径形成完整反馈；不得保留仅切换图标的伪播放、文案与实际导出类型不一致等伪交互。
- The OS analysis framework no longer separates “常规分析” and “精密分析”; present compatible analysis capabilities under “通用工具”, using a three-column workspace with the device tree on the left, tool switching and charts in the center, and time range, node/metric selection, data list, and the final “确定” action on the right.
- The “音视频分析” module must stay scoped to audio/video analysis only: do not expose 单趋势、多趋势, or unrelated analysis-tool entries inside this module. Its right operation panel is drag-resizable, and the selected point’s image attachment is expanded and shown directly by default.
- Alarm red states in “音视频分析” must be calculated per metric and threshold; a sample or row marked 运行正常 must never appear red merely because another metric or the same timestamp has an alarm. Do not show the removed standalone chart copy “2026-07-20 14:26:18 / 报警依据：跑偏20cm”.
- The “音视频分析” prototype must be a complete demonstrable frontend flow: switching audio/video points drives compatible metrics, charts, data rows, and attachment types; query actions show loading and validation feedback; visible toolbar and context-menu controls produce real cursor, annotation, alarm-line, false-signal, settings, export, media, and fullscreen states.
- “智慧视频监控”按值班员“发现告警 → 核实对应画面 → 填写原因并处置”的主链路组织：告警看护默认可见且与摄像头、单画面联动；点选画面不得自动切走告警队列；实时与报警证据默认完整显示、不使用裁剪；提供设备状态筛选、报警点位聚焦和收起 OS 导航的专注监控入口。
- “智慧视频监控”的报警摘要采用专业统计组件结构：上层以全宽主指标呈现“待处理告警”，横向对齐标题、主数值、紧急数和最长等待；下层以四列统一基线呈现今日新增、今日处理、转缺陷和处置率。等待时长按剩余 SLA 呈现中性、预警或超时色；保持平面化、网格化和克制的语义色，不使用整卡浅红底色、左侧红线、阴影或胶囊标签。
- “智慧视频监控”的实例图必须与设备和告警语义对应，使用统一的 16:9 固定高位 CCTV 工业现场视角，保留真实磨损、低照度和轻微视频压缩感；人员闯入、皮带跑偏、落料偏载、重锤异常、托辊异常和廊道烟雾分别使用独立证据图，图片本身不内嵌时间戳、品牌标识或 UI。
- “智慧视频监控”的每个可见按钮和输入都必须具备完整、可恢复的演示逻辑：设备勾选与临时查看分离，轮巡在弹窗、回放、云台操作和页面后台期间自动暂挂；云台按下启动、释放停止；手动录像进入回放；告警处置防重复并保护未提交说明；无能力或离线状态显示明确原因，不保留纯装饰性的伪交互。
- “智慧视频监控”全局仅保留 1–2 路信号中断/离线监控作为异常演示，其余设备保持在线或第三方状态，避免离线数量喧宾夺主。
- “智慧视频监控”的设备栏与右侧工作栏支持拖拽调宽、键盘调宽、双击复位、独立收起和状态持久化；报警摘要/报警列表、云台/回放支持纵向调高与单模块折叠。折叠与切换不得卸载模块上下文，实时画面始终保留核心可读空间，伸缩期间自动暂挂轮巡。
- The main navigation includes a module named “智能诊断”, implemented as a dense queue/detail/evidence workbench based on the provided diagnostic-reference screen while using the existing 智能运维OS light enterprise color system: light gray-blue workspace, white panels, OS blue selected states, neutral borders, restrained semantic alarm colors, and a light OS chart canvas; only the live现场图像 stage may retain a dark media treatment for legibility.
- “智能诊断” follows the operator path “筛选待处理病例 → 核查结论与依据 → 生成缺陷或填写原因关闭”; case selection synchronizes the conclusion, trend, and 现场图像, and completed actions move the case into the corresponding queue with updated counts and visible success feedback.
- “智能诊断” audio/video alarms follow the PRD hierarchy: the first-level list represents fault type and the second-level item represents “位置 + 故障类型”; software-composed titles prefer the latest alarm point’s 位置描述 and fall back to the point name, while algorithm-complete titles display directly.
- Pending roller alarms group by “故障部件 + 故障类型” only when at least two faulty positions exist; group severity/time come from the newest event. Opening a group replaces the left list with paginated roller details that support multi-select and batch 生成缺陷 / 关闭. 已成缺陷 and 已关闭 events are never grouped.
- Single and batch defect creation use the PRD field mappings, preserve one related-alarm row per event, generate a diagnostic-report view without empty sections, and append a treatment record to every processed alarm. Batch conclusions and recommendations come from the first selected event; batch phenomenon text merges selected evidence.
- The intelligent-diagnosis detail includes a fault-position overview, algorithm-specific parameter completeness only for supported belt modules, an explanatory probability tooltip, evidence-point attachment states with the newest alarm point selected by default, context-aware jumps to audio/video or roller analysis, structured suggestion sections, and a dismissible first-use guide.
- “智能诊断”必须显式展示支撑结论的关键证据事实，包括异常位置、识别结果、趋势连续性、媒体佐证及领域必需项；证据数量与可信状态按关键证据完整性计算。存在领域必需项缺失时显示“证据不足 / 缺少关键证据”，不得继续展示“高可信 / 4/4”。
- The selected intelligent-diagnosis visual target is `design-reference-intelligent-diagnosis-evidence-workbench.png`: diagnosis uses a flat 27/28/45 queue-verification-evidence layout, keeps evidence dominant on the right, shows a derived verification checklist and structured advice in the middle, and places close/defect actions across the middle and evidence columns only. Unsupported algorithms show parameter status as not applicable rather than a fabricated completeness percentage.
- 所有界面在首次进入、刷新或模块切换时自动完全收回 OS 左侧导航；用户可在当前界面临时展开，进入其他界面后再次自动收回，且清晰的恢复入口必须始终可见。
- “智能诊断”的病例队列、证据核查和现场证据三栏在桌面端均支持横向拖拽调宽、键盘方向键调宽、双击恢复默认宽度、独立收起与清晰恢复入口；宽度和收起状态需持久化，且不得允许三栏同时收起。宽度不超过 1100px 时切换为单栏焦点模式，通过三段式模块切换器选择当前面板，底部处置栏始终可见；回到桌面后恢复原有桌面布局状态。
- “智能诊断”的现场证据栏必须按自身实际宽度响应，而不是只按浏览器宽度响应；无论默认比例、拖到最窄、其他栏收起或工作台进入焦点模式，标题操作、趋势最右点与提示框、附件头、现场图像和底部处置按钮都必须完整落在可视区域内，不得被 `overflow` 静默裁切。
- “智能诊断”的托辊报警必须跳转独立“托辊组分析”，默认按异常托辊分析并带入报警托辊、报警指标、报警时刻和近15天范围；不得用通用音视频指标冒充托辊分析。
- “门限报警”使用独立的密集表格工作区，不复用智能诊断三栏详情：顶部依次提供批量处置、状态筛选、设备/组织与报警等级查询、刷新和导出；主体按“设备路径父行 + 报警事件子行”的树形表格展示，底部保留总数、翻页和每页条数。视觉统一采用智能运维 OS 浅色企业风格。
- “智能报警”与门限报警采用同族但数据隔离的全宽表格工作区，不复用智能诊断三栏详情；默认待处理为 0，展示专业空状态，状态数量为待处理 0 / 已成缺陷 0 / 已关闭 248 / 全部 248。顶部保留批量操作、设备/组织与报警等级查询、刷新和导出，主体保留树形报警表头与固定分页，并统一映射为智能运维 OS 浅色企业风格。
- “设备位置管理”的测点配置侧栏采用固定职责层级：测点摘要、设备绑定、展示指标、位置说明和固定操作栏；侧栏正文使用单一纵向滚动，不再让指标列表、备注和底部操作区形成相互争抢的嵌套滚动。
- “设备位置管理”的音视频设备与预置位采用纵向全宽字段，避免窄侧栏中长设备型号被左侧标签列过度挤压；所属环境以只读位置上下文呈现，设备连接状态与实时视频入口在设备绑定区内保持可见。
- “设备位置管理”的平面图工具栏按文件、缩放、视图、图层和标记维护；缩放顺序固定为缩小—百分比—放大—适应窗口，测点标记使用可感知的开关状态，清空标记只作用于当前设备空间。
- “设备位置管理”在 100% 适应窗口状态不显示冗余小地图；仅放大后展示导航小地图。缩放、当前环境、已定位数量和操作提示收敛到画布左下状态条，状态条和小地图使用绝对叠加，不得参与画布内容高度或制造额外滚动条。
- “设备位置管理”的图层管理浮层只管理当前空间底图与音视频测点显示，不得提供区域图层；图层显示变化只影响当前查看，不产生配置草稿。
- “设备位置管理”平面图左上提供当前测点上下文和重新定位捷径；支持 Ctrl/Command + 滚轮以 10% 步进缩放，普通滚轮继续用于画布滚动，并提供一键恢复 100% 与全部图层的默认视图。
- “设备位置管理”放大后的小地图必须真实反映当前视口的位置和占比，并支持点击小地图平移主画布；不得使用与实际滚动位置无关的固定示意框。
- “设备位置管理”顶部采用紧凑的两段式信息架构：页面标题与布局/同步/导出/刷新/保存操作位于首行，设备空间图与测点绑定位于独立页签行；不再展示全局“当前范围 / 四步配置完成度 / 配置检查 / 位置详情预览”状态行，将纵向空间直接留给下方独立空间图、设备空间树和测点配置工作区。
- “设备位置管理”支持导入自身导出的 JSON 位置配置；导入前必须校验测点唯一性、设备环境、音视频设备、预置位、巡检指标和归一化坐标，并先展示范围预览。导入仅替换测点页面草稿且保留当前 2D 平面图，不得自动覆盖平台已保存版本。
- “设备位置管理”选中的测点标记支持直接拖拽重新定位，并支持方向键按 0.25% 微调、Shift + 方向键按 1% 调整；位置变更统一进入未保存草稿，可通过测点撤销或整页撤销恢复。
- “设备位置管理”进入模块或从其他模块返回时必须清除浏览器与工作区遗留滚动位置，内容卡按动态视口扣除全局顶部栏和工作区留白后完整填充；浏览器缩放或高屏场景不得因内容整体上移而隐藏页面标题、页签并在底部留下空白。
- “设备位置管理”右侧测点表单的“应用到草稿”只写入页面草稿，顶部“保存配置”才生成平台已保存版本；存在未应用测点表单时禁止顶部保存和导出，并给出明确处理原因，页面同步状态需区分“测点修改未应用 / 页面草稿待保存 / 配置已同步”。
- “设备位置管理”的实时视频入口必须打开真实的 16:9 火电锅炉现场预览，在线设备支持刷新并反馈最新时间，离线设备展示明确原因且禁用刷新；音视频设备切换必须联动到该设备可用的预置位，不得保留不兼容组合。
- “设备位置管理”的测点信息首屏采用紧凑设备上下文摘要：摄像头、在线状态、采集站、设备空间、预置位与网络接入合并展示；“前往采集站管理”作为清晰但克制的头部动作，同机测点默认折叠并可展开切换。不得再使用多组大尺寸只读输入框、重复在线状态或重复实时视频入口挤占实时指标空间。
- “设备位置管理”的展示指标列表必须逐项显示当前运行状态（如正常、预警、报警、离线或待采集）；蓝色勾选仅表达配置选择，不再以“已选”占用运行状态位置。
- “设备位置管理”的“空间绑定关系”采用紧凑只读验收摘要：同时核对环境、设备与预置位、展示指标和空间定位，明确区分未应用表单、页面草稿与平台已保存版本；关系不完整时不得显示“关系有效”，并提供返回基础信息的可恢复编辑入口。
- “采集站管理 / 设备接入 / 控制能力”采用“能力概览—能力清单—实时控制—算法取景”四段式结构；非云台或离线设备必须就地说明旋转、光学变焦、聚焦和预置位不可用原因，同时保留数字缩放等可用能力及明确的算法标注下一步。
- “采集站管理 / 算法标注”同一数据组内的全部已绑定算法卡必须按内容高度完整展开，不得被固定高度网格压缩或由数据组 `overflow` 裁掉；空间不足时只允许最外层算法列表滚动，组头绑定数量必须与实际完整可见的算法卡数量一致。
- “采集站管理”只保留站点配置 / 算法标注这一套主工作台骨架；原“设备接入”独立大表格界面不再作为第二套页面存在。可复用的设备在线状态、视频流、云台能力、算法接入、交付就绪与定位配置能力应以紧凑设备概览、设备标签和算法定位动作合并进主工作台，其余独立组织树、筛选大表格、固定编辑抽屉与重复页头全部舍弃。
- “采集站管理”的海康资产粒度固定为“一台摄像头 = 一个采集站”：区域下直接列出摄像头采集站，每个站点只拥有当前这一台摄像头及其算法标注、预览、媒体能力和交付状态；不得再把多台摄像头聚合到一个“海康视频站”下。
- “采集站管理”整体视觉改为用户提供的深蓝工业配置工作台：深海军蓝背景与面板、青蓝高亮、浅蓝灰文字、左侧紧凑采集站树、顶部站点配置舱，以及下方左侧算法配置与右侧视频标注并排布局；不得回退为浅色企业后台风格。
- “设备位置管理”可支持测点级摄像头空间取景：测点可调整水平角、俯仰角、变焦倍数和视场角，变焦与视场角联动并在平面图即时改变视场扇区；不得新增、框选或维护任何设备环境区域。
- “设备位置管理”的测点配置不再拆成“基础信息 / 取景调整 / 关系摘要”三套页签；右侧统一为设备绑定、展示指标、位置说明的连续主任务流，低频空间取景与只读验收摘要按需展开，底部始终保留测点级撤销与应用动作。
- “设备位置管理”左侧持续展示配置队列，明确区分尚未绑定的音视频测点与已绑定但关系不完整的测点，并提供直达处理动作；指标区支持一键补齐设备目录推荐指标，交付检查必须能定位具体阻断项。
- “设备位置管理”平面图只保留一套测点位置工具栏，不再叠加重复工具条；页面顶部将导入、导出、平台刷新和整页撤销收进“更多”，持续露出同步状态、交付检查与保存配置。
- “设备位置管理 / 设备履历”打开后采用用户提供的深蓝时间轴界面为结构基准，并适配火电音视频巡检语义：顶部保留添加与收起，提供履历类型、设备/测点关键词和日期范围筛选；时间轴统一呈现巡检、报警处置、缺陷闭环、检修维护和配置变更，记录必须包含火电设备、中文测点、结论、指标结果、责任人及可预览的图像/视频/音频或报告证据，并继承当前空间与测点上下文。
- “设备位置管理”在不超过 1120px 的工作区不得依靠横向滚动展示右侧内容：设备空间树收敛为 228px，中央画布使用可收缩轨道，右侧五项功能舱收敛为 74px 图标轨道；测点详情以约 360px 覆盖层完整显示，正文只允许纵向滚动。`CONCEAL` 把手独占详情与功能轨道之间的 32px 边界，不得覆盖详情、底部操作、设备履历或功能图标；1440px 桌面仍恢复完整文字功能舱。
- “设备位置管理”在不超过 760px 的有效 CSS 宽度或高缩放环境进入详情聚焦态：空间树不再占位，五项功能入口仍保持其原本的右侧归属并收敛为最右侧 54px 图标轨道，测点详情或功能舱占满轨道左侧其余宽度且只允许纵向滚动；`CONCEAL` 必须内收在功能轨道底部，不得移到左侧或遮挡原有详情、滚动区域和持久操作。轨道折叠后只保留 32px 恢复边。
- “设备位置管理”的测点详情不展示“空间位置”分区、X/Y 坐标或“编辑此测点位置”重复入口；测点重定位统一保留在平面图任务入口与详情持久底部的“编辑位置”动作中。
