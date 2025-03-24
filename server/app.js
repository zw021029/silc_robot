const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = 'your-jwt-secret' // 实际使用时请使用环境变量

// 小程序配置
const APPID = 'your-appid'
const APP_SECRET = 'your-app-secret'

app.use(express.json())
app.use(cors())

// 用户数据存储（实际应用中应该使用数据库）
const users = new Map()
const robots = new Map([
  [1, { id: 1, name: '悉文', avatar: '/assets/images/robot-male.png' }],
  [2, { id: 2, name: '悉荟', avatar: '/assets/images/robot-female.png' }]
])

// 微信登录接口
app.post('/api/user/login', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录码'
      })
    }

    // 获取微信openid
    const wxLoginUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    const wxResponse = await axios.get(wxLoginUrl)
    const { openid, session_key } = wxResponse.data

    if (!openid) {
      return res.status(401).json({
        success: false,
        message: '微信登录失败'
      })
    }

    // 查找或创建用户
    let user = users.get(openid)
    if (!user) {
      user = {
        openid,
        createdAt: new Date(),
        selectedRobot: null
      }
      users.set(openid, user)
    }

    // 生成token
    const token = jwt.sign({ openid }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      token,
      userInfo: {
        openid,
        selectedRobot: user.selectedRobot
      }
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 验证token中间件
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = users.get(decoded.openid)
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '登录已过期'
    })
  }
}

// 验证token接口
app.get('/api/user/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    userInfo: {
      openid: req.user.openid,
      selectedRobot: req.user.selectedRobot
    }
  })
})

// 绑定机器人接口
app.put('/api/user/bind-robot', authMiddleware, (req, res) => {
  try {
    const { robotId } = req.body
    if (!robotId) {
      return res.status(400).json({
        success: false,
        message: '缺少机器人ID'
      })
    }

    const robot = robots.get(robotId)
    if (!robot) {
      return res.status(404).json({
        success: false,
        message: '机器人不存在'
      })
    }

    req.user.selectedRobot = robot
    
    res.json({
      success: true,
      data: robot
    })

  } catch (error) {
    console.error('绑定机器人错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
}) 