# 智能运维 OS 前端原型

面向工业运维场景的可交互前端原型，包含智慧视频监控、RH830 采集站管理和音视频分析模块。

## 项目结构

```text
.
├─ src/                 应用源码与业务图片
├─ docs/
│  ├─ prd/              当前 PRD 与历史版本
│  └─ qa/               设计核查和差距分析记录
├─ .github/workflows/   自动部署配置
├─ index.html           Vite 页面入口
├─ package.json         依赖与脚本
└─ vite.config.mjs      构建配置
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
```

正式产品需求以 [`docs/prd/[OS]V1.0.0_智能运维一体化升级_260720.md`](docs/prd/%5BOS%5DV1.0.0_%E6%99%BA%E8%83%BD%E8%BF%90%E7%BB%B4%E4%B8%80%E4%BD%93%E5%8C%96%E5%8D%87%E7%BA%A7_260720.md) 为准。
