# 博客照片处理脚本 (JavaScript 版本)

这是一个自动化的图片处理工具，用于处理博客相册照片。功能包括图片裁剪、压缩、生成JSON元数据以及自动提交到Git仓库。

## 功能特性

### 1. **图片裁剪** (`cutPhoto`)
- 将所有图片裁剪成正方形
- 自动选取图片中间部分进行裁剪
- 支持横向和纵向图片

### 2. **图片压缩** (`compressPhoto`)
- 批量压缩图片，减小文件体积
- 4个压缩级别可选：
  - 级别1：轻度压缩 (4M → 1M)
  - 级别2：中度压缩 (4M → 500K)
  - 级别3：高度压缩 (4M → 300K)
  - 级别4：最高压缩 (4M → 200K，默认)
- 自动跳过已压缩的文件
- 压缩后的图片保存在 `min_photos/` 目录

### 3. **生成JSON元数据** (`handlePhoto`)
- 根据文件名自动生成结构化的JSON数据
- 文件名格式：`YYYY-MM-DD_描述.jpg`
- 按年月分组组织照片
- 输出到博客的 `source/photos/data.json`

### 4. **Git自动提交** (`gitOperation`)
- 自动执行 `git add --all`
- 自动提交：`git commit -m "add photos"`
- 自动推送：`git push origin master`

## 目录结构

```
Blog-Back-Up/scripts/js/
├── imageProcess.js    # 图片处理核心模块
├── tool.js            # 主工作流脚本
├── package.json       # 项目配置文件
└── README.md          # 说明文档
```

## 安装依赖

```bash
cd Blog-Back-Up/scripts/js
npm install
```

## 使用方法

### 1. 完整工作流（推荐）

执行完整的图片处理流程：裁剪 → 压缩 → Git提交 → 生成JSON

```bash
npm start
```

或

```bash
node tool.js
```

### 2. 单独执行功能

```bash
# 只裁剪图片
npm run cut

# 只压缩图片
npm run compress

# 只生成JSON
npm run handle

# 只执行Git操作
npm run git
```

### 3. 在代码中使用

```javascript
const { cutPhoto, compressPhoto, handlePhoto, gitOperation } = require('./tool');

// 单独调用某个功能
await cutPhoto();
await compressPhoto();
await handlePhoto();
gitOperation();
```

## 照片命名规范

为了正确生成JSON数据，照片文件名必须遵循以下格式：

```
YYYY-MM-DD_描述文本.jpg
```

**示例：**
- `2026-01-10_春日樱花.jpg`
- `2026-01-15_海边日落.png`
- `2025-12-25_圣诞雪景.gif`

**说明：**
- 日期部分：`YYYY-MM-DD` 格式（必须）
- 下划线：`_` 作为分隔符（必须）
- 描述部分：任意文本（建议简短）
- 文件扩展名：支持 `jpg`, `png`, `gif`

## 工作流程

1. **裁剪阶段**：读取 `photos/` 目录下的所有图片，裁剪成正方形
2. **压缩阶段**：压缩图片并保存到 `min_photos/` 目录
3. **Git提交**：将更改提交到Git仓库
4. **生成JSON**：根据文件名生成 `data.json` 文件

## imageProcess.js API

### Graphics 类

```javascript
const Graphics = require('./imageProcess');
const graphics = new Graphics('input.jpg', 'output.jpg');
```

#### 方法列表

- `fixedSize(width, height)` - 调整为固定尺寸
- `resizeByWidth(wDivideH)` - 按宽度缩放（保持宽高比）
- `resizeByHeight(wDivideH)` - 按高度缩放（保持宽高比）
- `resizeBySize(sizeKB)` - 按文件大小压缩
- `cutByRatio()` - 裁剪成正方形

## 配置说明

### 修改输出路径

如果需要修改 JSON 文件的输出路径，请编辑 `tool.js` 中的 `handlePhoto` 函数：

```javascript
// 修改这一行
const outputPath = path.resolve(__dirname, '../../../source/photos/data.json');
```

### 修改压缩级别

在 `compressPhoto` 函数中修改压缩级别：

```javascript
await compress('4', desDir, srcDir, filesToCompress);  // 将 '4' 改为 '1', '2', '3'
```

## 依赖项

- **[sharp](https://sharp.pixelplumbing.com/)** (v0.32.6) - 高性能图片处理库
- Node.js >= 14.0.0

## 注意事项

1. **文件覆盖**：裁剪操作会直接修改原始文件，建议提前备份
2. **Git配置**：使用 Git 功能前，请确保已配置好 Git 环境和远程仓库
3. **路径配置**：根据实际项目结构调整输出路径
4. **Node版本**：推荐使用 Node.js 14 或更高版本
5. **Sharp兼容性**：某些系统可能需要额外的依赖库

## 与 Python 版本对比

| 功能 | Python版本 | JavaScript版本 |
|------|-----------|---------------|
| 图片处理库 | PIL/Pillow | sharp |
| 异步处理 | ❌ | ✅ |
| 执行速度 | 中等 | 更快 |
| 内存占用 | 中等 | 更低 |
| 易用性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 故障排除

### sharp 安装失败

```bash
# 尝试使用特定版本
npm install sharp@0.32.6

# 或清除缓存后重装
npm cache clean --force
npm install
```

### 找不到 photos 目录

确保在包含 `photos/` 目录的位置运行脚本，或修改脚本中的路径配置。

### Git 操作失败

检查 Git 配置和远程仓库连接：

```bash
git config --list
git remote -v
```

## 许可证

ISC

## 作者

根据 Python 版本脚本改写，使用 Node.js + sharp 实现。
