// pages/index/index.js
Page({
  data: {
    provinces: [],
    visitedCount: 0,
    totalCount: 34,  // 省级行政区数量
  },

  onLoad: function () {
    this.loadProvinces()
    this.loadUserInfo()
  },

  // 加载省份数据
  async loadProvinces() {
    // TODO: 从云数据库加载用户去过的省份
    const mockProvinces = [
      { name: '北京', visited: true, lat: 39.9042, lng: 116.4074 },
      { name: '上海', visited: true, lat: 31.2304, lng: 121.4737 },
      { name: '广东', visited: false, lat: 23.1291, lng: 113.2644 },
      { name: '浙江', visited: false, lat: 30.2741, lng: 120.1551 },
      // ... 更多省份
    ]
    
    const visitedCount = mockProvinces.filter(p => p.visited).length
    this.setData({
      provinces: mockProvinces,
      visitedCount
    })
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      // 引导登录
      wx.navigateTo({ url: '/pages/profile/profile' })
    }
  },

  // 点击省份
  onProvinceTap(e) {
    const { name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/province/province?name=${name}`
    })
  },

  // 绑定情侣
  onBindCouple() {
    wx.navigateTo({ url: '/pages/profile/profile?action=bind' })
  },
})
