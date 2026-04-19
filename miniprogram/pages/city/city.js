// pages/city/city.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cityName: '',
    provinceName: '',
    attractions: [],
    tripRecords: [],
    photos: [],
    cityStats: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const cityName = decodeURIComponent(options.cityName || '');
    const provinceName = decodeURIComponent(options.provinceName || '');
    
    this.setData({
      cityName: cityName,
      provinceName: provinceName
    });
    
    this.loadCityData(cityName, provinceName);
    this.loadTripRecords(cityName);
    this.loadCityPhotos(cityName);
  },

  /**
   * 加载城市数据
   */
  loadCityData: function(cityName, provinceName) {
    // 模拟加载城市景点数据，实际应用中从数据库或API获取
    const cityAttractions = {
      '北京市': [
        { name: '故宫', type: '历史文化', lat: 39.9163, lng: 116.3972 },
        { name: '天安门广场', type: '地标', lat: 39.9087, lng: 116.3973 },
        { name: '颐和园', type: '园林', lat: 39.9928, lng: 116.2749 },
        { name: '长城', type: '历史古迹', lat: 40.4319, lng: 116.5705 },
        { name: '天坛', type: '历史文化', lat: 39.8812, lng: 116.4072 }
      ],
      '上海市': [
        { name: '外滩', type: '地标', lat: 31.2363, lng: 121.4903 },
        { name: '东方明珠', type: '地标', lat: 31.2396, lng: 121.4998 },
        { name: '豫园', type: '园林', lat: 31.2277, lng: 121.4954 },
        { name: '上海博物馆', type: '文化', lat: 31.2318, lng: 121.4787 },
        { name: '田子坊', type: '文艺', lat: 31.2096, lng: 121.4763 }
      ],
      '广州市': [
        { name: '广州塔', type: '地标', lat: 23.1075, lng: 113.3309 },
        { name: '陈家祠', type: '历史文化', lat: 23.1118, lng: 113.2695 },
        { name: '沙面', type: '历史建筑', lat: 23.1133, lng: 113.2708 },
        { name: '北京路', type: '商业', lat: 23.1238, lng: 113.2806 },
        { name: '珠江夜游', type: '休闲娱乐', lat: 23.1195, lng: 113.3225 }
      ],
      '深圳市': [
        { name: '世界之窗', type: '主题公园', lat: 22.5344, lng: 113.9799 },
        { name: '欢乐谷', type: '主题公园', lat: 22.5407, lng: 113.9795 },
        { name: '大梅沙', type: '海滨', lat: 22.5788, lng: 114.3125 },
        { name: '锦绣中华', type: '民俗文化', lat: 22.5352, lng: 113.9786 },
        { name: '莲花山', type: '自然风光', lat: 22.5398, lng: 114.0567 }
      ],
      '杭州市': [
        { name: '西湖', type: '自然风光', lat: 30.2422, lng: 120.1435 },
        { name: '灵隐寺', type: '宗教文化', lat: 30.2444, lng: 120.0935 },
        { name: '宋城', type: '主题公园', lat: 30.1818, lng: 120.1072 },
        { name: '雷峰塔', type: '历史文化', lat: 30.2348, lng: 120.1492 },
        { name: '河坊街', type: '商业文化', lat: 30.2468, lng: 120.1597 }
      ]
    };

    const attractions = cityAttractions[cityName] || [];
    this.setData({
      attractions: attractions
    });
  },

  /**
   * 加载旅行记录
   */
  loadTripRecords: function(cityName) {
    wx.cloud.callFunction({
      name: 'trip/list',
      data: {
        city: cityName,
        page: 1,
        pageSize: 50
      },
      success: res => {
        if(res.result.success) {
          const trips = res.result.data.trips || [];

          const stats = {
            totalTrips: trips.length,
            totalPhotos: trips.reduce((sum, trip) => sum + (trip.photos ? trip.photos.length : 0), 0),
            firstVisit: trips.length > 0 ? new Date(Math.min(...trips.map(t => new Date(t.visitTime)))) : null
          };

          this.setData({
            tripRecords: trips,
            cityStats: stats
          });
        }
      },
      fail: err => {
        // 获取失败不影响页面显示
      }
    });
  },

  /**
   * 加载城市照片
   */
  loadCityPhotos: function(cityName) {
    wx.cloud.callFunction({
      name: 'photo/list',
      data: {
        city: cityName,
        page: 1,
        pageSize: 50
      },
      success: res => {
        if(res.result.success) {
          this.setData({
            photos: res.result.data.photos || []
          });
        }
      },
      fail: err => {
        // 获取失败不影响页面显示
      }
    });
  },

  /**
   * 跳转到景点详情
   */
  goToAttraction: function(e) {
    const attraction = e.currentTarget.dataset.attraction;
    wx.navigateTo({
      url: `/pages/attraction/attraction?name=${encodeURIComponent(attraction.name)}&cityName=${encodeURIComponent(this.data.cityName)}`
    });
  },

  /**
   * 跳转到旅行记录详情
   */
  goToTripDetail: function(e) {
    const trip = e.currentTarget.dataset.trip;
    wx.navigateTo({
      url: `/pages/trip/detail?id=${trip._id}`
    });
  },

  /**
   * 查看照片
   */
  viewPhoto: function(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.photos.map(photo => photo.fileId);
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  /**
   * 添加旅行记录
   */
  addTripRecord: function() {
    wx.navigateTo({
      url: `/pages/trip/add?cityName=${encodeURIComponent(this.data.cityName)}&provinceName=${encodeURIComponent(this.data.provinceName)}`
    });
  },

  /**
   * 刷新数据
   */
  refreshData: function() {
    this.loadTripRecords(this.data.cityName);
    this.loadCityPhotos(this.data.cityName);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时刷新数据
    this.refreshData();
  }
})