# PDF to Word Converter - 文档管理系统插件

可嵌入文档管理系统「Impart of Word」的PDF转Word程序，支持文件拖拽上传，自动识别处理。

## 功能特性

- **拖拽上传**: 支持拖拽PDF/Word文件到上传区域
- **智能识别**: 自动识别文字版PDF和扫描版PDF
- **格式转换**: PDF自动转换为可编辑Word格式
- **后台处理**: 所有操作自动完成，无需人工干预
- **自动分类**: 原始文件、转换后文件、日志自动分类存储
- **Word检索**: Word文件直接提取文本内容供检索

## 目录结构

```
pdf_to_word/
├── api_server.py      # FastAPI后端服务
├── pdf_converter.py   # PDF转换核心模块
├── index.html         # 前端拖拽界面
├── requirements.txt   # Python依赖
├── start.bat          # Windows启动脚本
└── output/            # 输出目录(自动创建)
    ├── original/      # 原始文件
    ├── converted/     # 转换后文件
    └── logs/          # 操作日志
```

## 依赖说明

```
fastapi>=0.104.0          # Web框架
uvicorn[standard]>=0.24.0 # ASGI服务器
python-multipart>=0.0.6   # 文件上传支持
pdf2docx>=0.5.6           # PDF转Word核心库
PyPDF2>=3.0.1             # PDF文本提取
python-docx>=1.1.0        # Word文档处理
```

## 部署步骤

### 方式一: 快速启动 (Windows)

1. 确保已安装Python 3.8+
2. 双击运行 `start.bat`
3. 访问 http://localhost:8765

### 方式二: 命令行启动

```bash
# 进入目录
cd pdf_to_word

# 安装依赖
pip install -r requirements.txt

# 启动服务
python api_server.py
```

### 方式三: 独立端口部署

```bash
# 指定端口启动
python api_server.py --port 8765
```

## API接口

### POST /api/upload
上传并处理文件

**请求**: `multipart/form-data`
- `file`: 文件对象(.pdf, .doc, .docx)

**响应**:
```json
{
  "success": true,
  "type": "pdf_converted",
  "original_file": "input.pdf",
  "converted_file": "input_20240101_120000.docx",
  "message": "Successfully converted (pdf2docx)"
}
```

### GET /api/status
获取服务状态和输出目录

### GET /api/logs
获取最近操作日志

### GET /api/files
列出所有处理过的文件

## 使用流程

1. 拖拽PDF或Word文件到上传区域
2. 系统自动识别文件类型
3. PDF文件自动转换为Word格式
4. 转换完成后自动存储到对应目录
5. 返回处理结果供后续检索使用

## Word插件集成

要将此服务集成到Word插件:

```javascript
// Word插件中拖拽文件时调用
async function handleFileDrop(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8765/api/upload', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  if (result.success) {
    // 处理成功，获取转换后的文件路径
    const convertedPath = result.output_path;
    // 继续后续检索流程
  }
}
```

## 故障排除

### pdf2docx安装失败
```bash
pip install pdf2docx==0.5.6 -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 端口被占用
修改 `api_server.py` 中的端口号:
```python
uvicorn.run(app, host="0.0.0.0", port=8888, log_level="info")
```

### 转换失败
检查日志文件: `output/logs/operation_YYYYMMDD.log`

## 许可协议

MIT License
