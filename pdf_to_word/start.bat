@echo off
chcp 65001 >nul
echo ========================================
echo   PDF to Word Converter 启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查Python环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo.
echo [2/3] 安装依赖...
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if errorlevel 1 (
    echo 警告: 依赖安装可能有问题，继续启动...
)

echo.
echo [3/3] 启动服务...
echo.
echo 服务地址: http://localhost:8765
echo 访问地址: http://localhost:8765/
echo.
echo 按 Ctrl+C 停止服务
echo.

python api_server.py

pause
