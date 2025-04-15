const app = getApp();

Page({
  data: {
    id: '',
    question: '',
    answer: '',
    category: '',
    tags: '',
    categories: ['常见问题', '产品介绍', '使用指南', 'auto_generated']
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadKnowledge();
    }
  },

  // 加载知识库条目
  async loadKnowledge() {
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/knowledge/${this.data.id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        }
      });

      if (res.data.success) {
        const { question, answer, category, tags } = res.data.data;
        this.setData({
          question,
          answer,
          category,
          tags: tags.join(',')
        });
      }
    } catch (error) {
      console.error('加载知识库条目失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 输入框变化
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      category: this.data.categories[e.detail.value]
    });
  },

  // 保存
  async save() {
    const { id, question, answer, category, tags } = this.data;

    if (!question || !answer || !category) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    try {
      const data = {
        question,
        answer,
        category,
        tags: tags.split(',').filter(tag => tag.trim())
      };

      const url = id 
        ? `${app.globalData.baseUrl}/api/admin/knowledge/${id}`
        : `${app.globalData.baseUrl}/api/admin/knowledge`;

      const res = await wx.request({
        url,
        method: id ? 'PUT' : 'POST',
        data,
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        }
      });

      if (res.data.success) {
        wx.showToast({
          title: '保存成功'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('保存知识库条目失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
}); 