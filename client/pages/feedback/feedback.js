Page({
  data: {
    feedbackContent: '',
    contactInfo: '',
    wordCount: 0
  },

  onInput(e) {
    const content = e.detail.value;
    this.setData({
      feedbackContent: content,
      wordCount: content.length
    });
  },

  onContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  submitFeedback() {
    const { feedbackContent, contactInfo } = this.data;
    
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    // 这里添加提交反馈的逻辑
    wx.showLoading({
      title: '提交中...',
    });

    // 模拟提交
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        }
      });
    }, 1500);
  }
});
