// pages/album/album.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    albums: [],
    timeline: [],
    selectedYear: '',
    years: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadAlbumData();
  },

  /**
   * 加载相册数据
   */
  loadAlbumData: function() {
    const that = this;
    wx.showLoading({
      title: '加载中...'
    });

    // 获取所有旅行记录和照片
    wx.cloud.callFunction({
      name: 'trip/list',
      data: {
        page: 1,
        pageSize: 100
      },
      success: res => {
        console.log('获取旅行记录成功', res);
        if(res.result.success) {
          const trips = res.result.data.trips || [];
          
          // 整理数据：按年份分组旅行记录
          const groupedByYear = this.groupTripsByYear(trips);
          const years = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));
          
          // 构建时间线
          const timeline = this.buildTimeline(trips);
          
          this.setData({
            albums: groupedByYear,
            timeline: timeline,
            years: years,
            selectedYear: years.length > 0 ? years[0] : '',
            loading: false
          });
        }
      },
      fail: err => {
        console.error('获取旅行记录失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
        this.setData({
          loading: false
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 按年份分组旅行记录
   */
  groupTripsByYear: function(trips) {
    const grouped = {};
    
    trips.forEach(trip => {
      const year = new Date(trip.visitTime).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(trip);
    });
    
    return grouped;
  },

  /**
   * 构建时间线数据
   */
  buildTimeline: function(trips) {
    // 按时间排序
    const sortedTrips = trips.sort((a, b) => new Date(b.visitTime) - new Date(a.visitTime));
    
    // 为每条记录添加照片
    const timeline = sortedTrips.map(trip => {
      return {
        ...trip,
        photos: trip.photos || [],
        dateStr: this.formatDate(new Date(trip.visitTime))
      };
    });
    
    return timeline;
  },

  /**
   * 格式化日期
   */
  formatDate: function(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  },

  /**
   * 选择年份
   */
  selectYear: function(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({
      selectedYear: year
    });
  },

  /**
   * 查看照片
   */
  viewPhoto: function(e) {
    const trip = e.currentTarget.dataset.trip;
    const photoIndex = e.currentTarget.dataset.index;
    const urls = trip.photos;
    
    wx.previewImage({
      current: urls[photoIndex],
      urls: urls
    });
  },

  /**
   * 跳转到旅行详情
   */
  goToTripDetail: function(e) {
    const trip = e.currentTarget.dataset.trip;
    wx.navigateTo({
      url: `/pages/trip/detail?id=${trip._id}`
    });
  },

  /**
   * 刷新数据
   */
  refreshData: function() {
    this.setData({
      loading: true
    });
    this.loadAlbumData();
  },

  /**
   * 添加旅行记录
   */
  addTripRecord: function() {
    wx.navigateTo({
      url: '/pages/trip/add'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时重新加载数据
    this.refreshData();
  }
})