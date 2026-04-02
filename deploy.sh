#!/bin/bash

# couple-trip-map 项目部署脚本

echo "🚀 开始部署 couple-trip-map 项目..."

# 检查当前目录
echo "📍 当前目录: $(pwd)"

# 检查 Git 状态
echo "🔍 检查 Git 状态..."
git status

# 添加所有更改
echo "📦 添加所有更改..."
git add .

# 提交更改
echo "📝 提交更改..."
git commit -m " feat: 完成核心功能开发

- 完成个人中心页面 (profile) - 情侣绑定/解绑功能
- 完成情侣关系云函数 (couple) - 绑定码生成、加入/创建情侣关系
- 完成旅行记录云函数 (trip) - 添加/查询/更新/删除旅行记录
- 完成照片管理云函数 (photo) - 上传/查询/删除照片
- 完成省份详情页面 (province) - 城市列表、访问统计、进度条
- 完成城市详情页面 (city) - 景点列表、旅行记录、照片墙
- 完成相册页面 (album) - 按年份分组的旅行相册、时间线视图
- 更新 README.md - 添加已完成功能清单"

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

echo "✅ 部署完成！"
echo "🔗 项目地址: https://github.com/sy0310/couple-trip-map"