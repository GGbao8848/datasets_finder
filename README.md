# Dataset Finder

<div align="center">

📊 **轻量级数据集管理工具**

一个无需安装、隐私安全且兼容局域网环境的数据集分析工具

[功能特性](#功能特性) • [快速开始](#快速开始) • [使用指南](#使用指南) • [支持格式](#支持格式)

</div>

---

## 功能特性

✨ **多格式支持**
- 🎯 YOLO (TXT) - 自动识别 classes.txt / obj.names
- 📦 COCO (JSON) - 支持标准 COCO 格式
- 📄 Pascal VOC (XML) - 解析 XML 标注文件
- 🔄 LabelMe (JSON) - 兼容 LabelMe 格式

🚀 **核心功能**
- 📁 递归遍历子目录,自动发现所有标注文件
- 📊 统计类别分布、标注数量、文件数量
- 🔍 实时搜索和排序功能
- 📋 一键复制路径,方便配置文件使用
- 📥 导出 Excel 报表

🔒 **隐私安全**
- 🏠 所有数据处理完全在本地完成
- 🚫 不上传任何数据到外部服务器
- 🌐 支持局域网访问,团队协作更便捷

## 快速开始

### 安装依赖

```bash
# 克隆或下载项目
cd datasets_finder

# 安装 Python 依赖
pip install -r requirements.txt
```

### 启动服务

**本地访问:**
```bash
python app.py
```
访问: `http://localhost:5000`

**局域网访问:**
```bash
python app.py --host 0.0.0.0 --port 5000
```
访问: `http://<你的IP地址>:5000`

**自定义端口:**
```bash
python app.py --port 8080
```

**调试模式:**
```bash
python app.py --debug
```

## 使用指南

### 1️⃣ 选择数据集文件夹

点击"选择文件夹"按钮,选择你的数据集根目录。程序会自动遍历所有子目录。

> **注意**: 由于浏览器安全限制,需要手动输入文件夹的绝对路径。

### 2️⃣ 配置路径前缀 (可选)

在"路径前缀"输入框中输入绝对路径前缀,例如:
```
/home/user/datasets
```

这样可以一键复制完整的绝对路径,方便粘贴到训练配置文件中。

### 3️⃣ 查看分析结果

分析完成后,界面会显示:
- **统计卡片**: 类别总数、标注总数、文件总数
- **数据表格**: 详细的类别信息
  - 类别名称
  - 标注数量 (该类别的框数)
  - 文件数量 (包含该类别的图片数)
  - 存储路径 (子文件夹路径)

### 4️⃣ 搜索和排序

- 🔍 使用搜索框快速查找特定类别
- ⬆️⬇️ 点击表头进行排序

### 5️⃣ 复制路径

点击路径标签旁的 📋 按钮,即可复制完整路径到剪贴板。

### 6️⃣ 导出 Excel

点击"导出 Excel"按钮,生成包含所有统计信息的 Excel 报表。

## 支持格式

### YOLO 格式

**文件结构:**
```
dataset/
├── images/
│   ├── train/
│   └── val/
├── labels/
│   ├── train/
│   │   ├── img1.txt
│   │   └── img2.txt
│   └── val/
└── classes.txt  # 或 obj.names
```

**classes.txt 示例:**
```
person
car
dog
cat
```

**标注文件 (img1.txt) 示例:**
```
0 0.5 0.5 0.3 0.4
1 0.2 0.3 0.1 0.2
```

### COCO 格式

**JSON 结构:**
```json
{
  "categories": [
    {"id": 1, "name": "person"},
    {"id": 2, "name": "car"}
  ],
  "annotations": [
    {
      "category_id": 1,
      "bbox": [100, 100, 200, 150]
    }
  ]
}
```

### Pascal VOC 格式

**XML 结构:**
```xml
<annotation>
  <object>
    <name>person</name>
    <bndbox>
      <xmin>100</xmin>
      <ymin>100</ymin>
      <xmax>300</xmax>
      <ymax>250</ymax>
    </bndbox>
  </object>
</annotation>
```

## 局域网访问配置

### 获取本机 IP 地址

**Windows:**
```bash
ipconfig
```
查找 "IPv4 地址"

**Mac/Linux:**
```bash
ifconfig
# 或
ip addr show
```
查找 "inet" 地址

### 启动服务

```bash
python app.py --host 0.0.0.0 --port 5000
```

启动后,程序会自动显示:
```
==============================================================
  Dataset Finder - Dataset Management Tool
==============================================================

  🌐 Local access:    http://localhost:5000
  🌐 LAN access:      http://192.168.1.100:5000

  📁 Supported formats: YOLO, COCO, Pascal VOC
  🔒 Privacy: All processing is local

==============================================================
```

### 防火墙设置

确保防火墙允许指定端口的入站连接。

**Windows:**
```
控制面板 -> Windows Defender 防火墙 -> 高级设置 -> 入站规则 -> 新建规则
```

**Mac:**
```
系统偏好设置 -> 安全性与隐私 -> 防火墙 -> 防火墙选项
```

**Linux (ufw):**
```bash
sudo ufw allow 5000
```

## 技术栈

- **后端**: Flask 3.0
- **前端**: 原生 HTML/CSS/JavaScript
- **数据处理**: Python 标准库 + openpyxl
- **样式**: 现代化深色主题,渐变效果

## 项目结构

```
datasets_finder/
├── app.py                 # Flask 主应用
├── analyzer.py            # 数据集分析引擎
├── exporter.py            # Excel 导出功能
├── parsers/               # 解析器模块
│   ├── __init__.py
│   ├── xml_parser.py      # Pascal VOC 解析器
│   ├── json_parser.py     # COCO/LabelMe 解析器
│   └── txt_parser.py      # YOLO 解析器
├── static/                # 前端资源
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── exports/               # Excel 导出目录
├── requirements.txt       # Python 依赖
└── README.md
```

## 常见问题

**Q: 浏览器不支持文件夹选择?**

A: 请使用 Chrome、Edge 或其他现代浏览器。如果仍不支持,会自动切换到手动输入路径模式。

**Q: 找不到类别名称文件?**

A: 对于 YOLO 格式,程序会自动在数据集目录及其父目录中查找 `classes.txt`、`obj.names`、`class.names` 或 `labels.txt`。

**Q: 如何处理大型数据集?**

A: 程序会递归遍历所有子目录,对于超大数据集可能需要一些时间。建议先在小规模数据集上测试。

**Q: 局域网内其他设备无法访问?**

A: 检查防火墙设置,确保允许指定端口的入站连接。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!

---

<div align="center">

**Made with ❤️ for Deep Learning Engineers**

</div>
