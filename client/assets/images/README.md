# 图片资源目录

本目录用于存放小程序使用的图片资源。

## 目录结构

```
images/
├── logo.png           # 应用logo
├── voice.png         # 语音图标
├── wechat.png        # 微信图标
├── moments.png       # 朋友圈图标
└── robots/           # 机器人头像
    ├── xiwen.png     # 悉文机器人头像
    └── xihui.png     # 悉荟机器人头像
```

## 图片要求

1. 所有图片建议使用PNG格式
2. 图片大小建议不超过100KB
3. 图片尺寸建议：
   - logo.png: 200x200px
   - 图标类: 64x64px
   - 机器人头像: 128x128px

## 使用说明

1. 在WXML中使用图片时，路径应该以 `/assets/images/` 开头
2. 示例：
   ```html
   <image src="/assets/images/logo.png" />
   <image src="/assets/images/robots/xiwen.png" />
   ``` 