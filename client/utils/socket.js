/**
 * WebSocket工具类
 */
class ChatSocket {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.messageHandlers = new Map();
  }

  // 连接WebSocket
  connect() {
    if (this.socket) {
      return;
    }

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '未登录，请先登录',
        icon: 'none'
      });
      return;
    }

    const wsUrl = `ws://127.0.0.1:3005/api/ws/chat?token=${token}`;
    
    try {
      this.socket = wx.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('WebSocket连接成功');
          this.reconnectAttempts = 0;
          // 等待连接打开后再初始化事件处理器
          setTimeout(() => {
            this.initEventHandlers();
          }, 100);
        },
        fail: (error) => {
          console.error('WebSocket连接失败:', error);
          this.handleReconnect();
        }
      });
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.handleReconnect();
    }
  }

  // 初始化事件处理器
  initEventHandlers() {
    if (!this.socket) {
      console.error('WebSocket未连接');
      return;
    }

    this.socket.onOpen(() => {
      console.log('WebSocket连接已打开');
    });

    this.socket.onClose(() => {
      console.log('WebSocket连接已关闭');
      this.handleReconnect();
    });

    this.socket.onError((error) => {
      console.error('WebSocket错误:', error);
    });

    this.socket.onMessage((res) => {
      try {
        const message = JSON.parse(res.data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.data);
        }
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });
  }

  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数超过限制');
      return;
    }

    this.reconnectAttempts++;
    console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // 发送消息
  send(message) {
    if (!this.socket) {
      console.error('WebSocket未连接');
      return;
    }

    this.socket.send({
      data: JSON.stringify(message),
      success: () => {
        console.log('消息发送成功');
      },
      fail: (error) => {
        console.error('消息发送失败:', error);
      }
    });
  }

  // 注册消息处理器
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  // 移除消息处理器
  offMessage(type) {
    this.messageHandlers.delete(type);
  }

  // 关闭连接
  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.messageHandlers.clear();
    }
  }
}

// 创建单例实例
const chatSocket = new ChatSocket();

module.exports = chatSocket; 