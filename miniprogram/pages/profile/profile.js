// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    coupleInfo: null,
    isCoupleBound: false,
    bindCode: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserInfo();
    this.checkCoupleStatus();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo: function() {
    const userInfo = wx.getStorageSync('userInfo') || null;
    this.setData({
      userInfo: userInfo
    });
  },

  /**
   * 检查情侣绑定状态
   */
  checkCoupleStatus: function() {
    const that = this;
    wx.cloud.callFunction({
      name: 'couple/check',
      data: {},
      success: res => {
        console.log('检查情侣状态成功', res);
        if(res.result.success) {
          this.setData({
            isCoupleBound: true,
            coupleInfo: res.result.data
          });
        }
      },
      fail: err => {
        console.error('检查情侣状态失败', err);
      }
    });
  },

  /**
   * 生成绑定码
   */
  generateBindCode: function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.setData({
      bindCode: result
    });
    wx.setClipboardData({
      data: result,
      success: () => {
        wx.showToast({
          title: '绑定码已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 创建情侣关系
   */
  createCouple: function() {
    wx.showLoading({
      title: '创建中...'
    });

    wx.cloud.callFunction({
      name: 'couple/bind',
      data: {
        action: 'create'
      },
      success: res => {
        console.log('创建情侣关系成功', res);
        if(res.result.success) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });
          this.setData({
            isCoupleBound: true,
            coupleInfo: res.result.data
          });
        } else {
          wx.showToast({
            title: res.result.message || '创建失败',
            icon: 'error'
          });
        }
      },
      fail: err => {
        console.error('创建情侣关系失败', err);
        wx.showToast({
          title: '创建失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 加入情侣关系
   */
  joinCouple: function() {
    if (!this.data.bindCode.trim()) {
      wx.showToast({
        title: '请输入绑定码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '加入中...'
    });

    wx.cloud.callFunction({
      name: 'couple/bind',
      data: {
        action: 'join',
        bindCode: this.data.bindCode.trim()
      },
      success: res => {
        console.log('加入情侣关系成功', res);
        if(res.result.success) {
          wx.showToast({
            title: '加入成功',
            icon: 'success'
          });
          this.setData({
            isCoupleBound: true,
            coupleInfo: res.result.data
          });
        } else {
          wx.showToast({
            title: res.result.message || '加入失败',
            icon: 'error'
          });
        }
      },
      fail: err => {
        console.error('加入情侣关系失败', err);
        wx.showToast({
          title: '加入失败',
          icon: 'error'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 解除情侣关系
   */
  unbindCouple: function() {
    wx.showModal({
      title: '确认解除',
      content: '确定要解除情侣关系吗？此操作不可逆。',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'couple/unbind',
            data: {},
            success: res => {
              console.log('解除情侣关系成功', res);
              if(res.result.success) {
                wx.showToast({
                  title: '解除成功',
                  icon: 'success'
                });
                this.setData({
                  isCoupleBound: false,
                  coupleInfo: null
                });
              } else {
                wx.showToast({
                  title: res.result.message || '解除失败',
                  icon: 'error'
                });
              }
            },
            fail: err => {
              console.error('解除情侣关系失败', err);
              wx.showToast({
                title: '解除失败',
                icon: 'error'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 输入绑定码
   */
  onBindCodeInput: function(e) {
    this.setData({
      bindCode: e.detail.value
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkCoupleStatus();
  }
})