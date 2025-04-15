const app = getApp();
const BASE_URL = 'http://127.0.0.1:3005'; // 定义BASE_URL

Page({
  data: {
    activeTab: 'chatHistory',
    chatHistory: [],
    knowledgeList: [],
    currentPage: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    dateRange: {
      start: '',
      end: ''
    },
    searchKeyword: '',
    selectedCategory: '全部',
    categories: ['全部', '常规问题', '新增问题', '自定义问题']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    try {
      // 使用app.getUserInfo获取用户信息并验证管理员权限
      const userInfo = await app.getUserInfo();
      
      if (!userInfo || !userInfo.isAdmin) {
        console.log('非管理员用户，重定向到首页', userInfo);
        wx.showToast({
          title: '无权限访问',
          icon: 'none'
        });
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index',
          });
        }, 1500);
        return;
      }

      console.log('管理员用户已登录', userInfo);
      
      // 初始化页面数据
      this.setData({
        activeTab: this.data.activeTab || 'chatHistory',
      });

      // 根据激活的标签加载相应数据
      if (this.data.activeTab === 'chatHistory') {
        await this.loadChatHistory();
      } else if (this.data.activeTab === 'knowledge') {
        await this.loadKnowledgeList();
      }
    } catch (error) {
      console.error('管理页面加载错误:', error);
      
      // 如果是未登录错误，重定向到登录页面
      if (error.message === '用户未登录') {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/login/login',
          });
        }, 1500);
        return;
      }
      
      wx.showToast({
        title: '页面加载失败',
        icon: 'none'
      });
    }
  },

  // 处理标签切换
  async handleTabChange(e) {
    const activeTab = e.currentTarget.dataset.tab;
    
    this.setData({
      activeTab,
      currentPage: 1
    });

    // 根据激活的标签加载相应数据
    if (activeTab === 'chatHistory') {
      await this.loadChatHistory();
    } else if (activeTab === 'knowledge') {
      await this.loadKnowledgeList();
    }
  },

  // 加载对话历史
  async loadChatHistory() {
    const { dateRange, currentPage, pageSize } = this.data;
    const params = {
      page: currentPage,
      pageSize: pageSize
    };

    if (dateRange.start) params.startDate = dateRange.start;
    if (dateRange.end) params.endDate = dateRange.end;
    
    // 添加调试信息
    const token = wx.getStorageSync('token');
    console.log('加载聊天历史使用的参数:', params);
    console.log('使用的token:', token ? token.substring(0, 20) + '...' : 'null');
    
    try {
      this.setData({ loading: true });
      
      // 使用Promise包装wx.request以便更好地处理错误
      const res = await new Promise((resolve, reject) => {
        const requestTask = wx.request({
          url: `${BASE_URL}/api/admin/chat-history`,
          method: 'GET',
          data: params,
          header: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000, // 10秒超时
          success: resolve,
          fail: (error) => {
            console.error('请求失败详情:', error);
            reject(error);
          }
        });
        
        // 监听请求状态
        requestTask.onHeadersReceived((result) => {
          console.log('收到响应头:', result.header);
        });
      });
      
      // 打印响应信息
      console.log('聊天历史响应状态码:', res.statusCode);
      console.log('聊天历史响应数据:', res.data ? JSON.stringify(res.data).substring(0, 100) + '...' : 'null');
      
      if (res.statusCode === 200 && res.data && res.data.success) {
        // 将消息按chatId和时间排序，组织成问答对
        const messagesList = res.data.data.list || [];
        
        // 按chatId分组
        const chatGroups = {};
        messagesList.forEach(msg => {
          if (!chatGroups[msg.chatId]) {
            chatGroups[msg.chatId] = [];
          }
          chatGroups[msg.chatId].push(msg);
        });
        
        // 将每个chatId的消息按时间排序
        Object.keys(chatGroups).forEach(chatId => {
          chatGroups[chatId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        
        // 将消息组织成问答对
        const pairedMessages = [];
        
        Object.values(chatGroups).forEach(messages => {
          for (let i = 0; i < messages.length; i += 2) {
            const userMsg = messages[i];
            const robotMsg = messages[i + 1];
            
            if (userMsg && userMsg.type === 'user') {
              const pair = {
                id: userMsg._id,
                userMessage: userMsg,
                robotMessage: robotMsg,
                userId: userMsg.userId,
                robotId: userMsg.robotId,
                chatId: userMsg.chatId,
                createdAt: userMsg.createdAt,
                isPair: !!robotMsg
              };
              pairedMessages.push(pair);
            } else if (userMsg) {
              // 处理没有用户消息的机器人消息
              pairedMessages.push({
                id: userMsg._id,
                robotMessage: userMsg,
                userId: userMsg.userId,
                robotId: userMsg.robotId,
                chatId: userMsg.chatId,
                createdAt: userMsg.createdAt,
                isPair: false
              });
            }
          }
        });
        
        // 按时间排序，最新的在前面
        pairedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        this.setData({
          chatHistory: pairedMessages,
          total: res.data.data.total || 0
        });
      } else {
        throw new Error((res.data && res.data.message) ? res.data.message : '加载失败');
      }
    } catch (error) {
      console.error('加载对话历史失败:', error);
      wx.showToast({
        title: (error && error.message) ? error.message : '网络连接失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载知识库列表
  async loadKnowledgeList() {
    const { currentPage, pageSize, searchKeyword, selectedCategory } = this.data;
    const params = {
      page: currentPage,
      limit: pageSize
    };

    if (searchKeyword) {
      params.keyword = searchKeyword;
    }
    if (selectedCategory && selectedCategory !== '全部') {
      params.category = selectedCategory;
    }

    try {
      const token = wx.getStorageSync('token');

      // 使用Promise包装wx.request
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${BASE_URL}/api/admin/knowledge`,
          method: 'GET',
          data: params,
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: resolve,
          fail: reject
        });
      });

      console.log('知识库列表响应:', res);
      
      if (res.statusCode === 200 && res.data && res.data.success) {
        const data = res.data.data || {};
        this.setData({
          knowledgeList: data.knowledgeList || [],
          total: data.total || 0
        });
      } else {
        console.error('获取知识库列表失败:', res);
        wx.showToast({
          title: (res.data && res.data.message) ? res.data.message : '获取数据失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('请求知识库列表出错:', error);
      wx.showToast({
        title: (error && error.message) ? error.message : '请求失败',
        icon: 'none'
      });
    }
  },

  // 日期选择
  onDateChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      [`dateRange.${type}`]: e.detail.value
    }, () => {
      this.setData({ currentPage: 1 }, () => {
        this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
      });
    });
  },

  // 搜索
  onSearch(e) {
    this.setData({
      searchKeyword: e.detail.value,
      currentPage: 1
    }, () => {
      this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
    });
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      selectedCategory: e.detail.value,
      currentPage: 1
    }, () => {
      this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
    });
  },

  // 添加知识库条目
  async addKnowledge() {
    wx.navigateTo({
      url: '/pages/admin/knowledge/edit'
    });
  },

  // 编辑知识库条目
  async editKnowledge(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/admin/knowledge/edit?id=${id}`
    });
  },

  // 删除知识库条目
  async deleteKnowledge(e) {
    const { id } = e.currentTarget.dataset;
    try {
      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这条知识库条目吗？'
      });

      if (res.confirm) {
        const token = wx.getStorageSync('token');
        const deleteRes = await wx.request({
          url: `${BASE_URL}/api/admin/knowledge/${id}`,
          method: 'DELETE',
          header: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (deleteRes.data && deleteRes.data.success) {
          wx.showToast({
            title: '删除成功'
          });
          this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
        } else {
          wx.showToast({
            title: (deleteRes.data && deleteRes.data.message) ? deleteRes.data.message : '删除失败',
            icon: 'none'
          });
        }
      }
    } catch (error) {
      console.error('删除知识库条目失败:', error);
      wx.showToast({
        title: (error && error.message) ? error.message : '删除失败',
        icon: 'none'
      });
    }
  },

  // 上传文件
  async uploadFile() {
    try {
      const res = await wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['txt']
      });

      if (res.tempFiles.length > 0) {
        const token = wx.getStorageSync('token');
        const file = res.tempFiles[0];
        const uploadRes = await wx.uploadFile({
          url: `${BASE_URL}/api/admin/knowledge/process-file`,
          filePath: file.path,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = JSON.parse(uploadRes.data);
        if (result.success) {
          wx.showToast({
            title: '处理成功'
          });
          this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
        }
      }
    } catch (error) {
      console.error('上传文件失败:', error);
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ currentPage: 1 }, () => {
      this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } }).then(() => {
        wx.stopPullDownRefresh();
      });
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.loading || this.data.chatHistory.length >= this.data.total) return;
    this.setData({
      currentPage: this.data.currentPage + 1
    }, () => {
      this.handleTabChange({ currentTarget: { dataset: { tab: this.data.activeTab } } });
    });
  }
}); 