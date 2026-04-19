// pages/province/province.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    provinceName: '',
    cities: [],
    visitedCities: [],
    provinceStats: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const provinceName = decodeURIComponent(options.provinceName || '');
    this.setData({
      provinceName: provinceName
    });
    this.loadProvinceData(provinceName);
    this.loadVisitedCities(provinceName);
  },

  /**
   * 加载省份数据
   */
  loadProvinceData: function(provinceName) {
    // 模拟加载省份数据，实际应用中从云数据库获取
    const provincesData = {
      '北京市': {
        cities: ['北京市']
      },
      '上海市': {
        cities: ['上海市']
      },
      '广东省': {
        cities: ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市']
      },
      '江苏省': {
        cities: ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市']
      },
      '浙江省': {
        cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市']
      },
      '四川省': {
        cities: ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州']
      },
      '湖北省': {
        cities: ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施土家族苗族自治州', '仙桃市', '潜江市', '天门市', '神农架林区']
      },
      '陕西省': {
        cities: ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市']
      },
      '湖南省': {
        cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州']
      },
      '河南省': {
        cities: ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市', '济源市']
      }
    };

    const cities = provincesData[provinceName] ? provincesData[provinceName].cities : [];
    this.setData({
      cities: cities
    });
  },

  /**
   * 加载已访问的城市
   */
  loadVisitedCities: function(provinceName) {
    wx.cloud.callFunction({
      name: 'trip/list',
      data: {
        province: provinceName,
        page: 1,
        pageSize: 100
      },
      success: res => {
        if(res.result.success) {
          const trips = res.result.data.trips || [];

          const visitedCityNames = [...new Set(trips.map(trip => trip.city))];

          const stats = {
            totalCities: this.data.cities.length,
            visitedCities: visitedCityNames.length,
            completionRate: this.data.cities.length > 0
              ? Math.round((visitedCityNames.length / this.data.cities.length) * 100)
              : 0
          };

          this.setData({
            visitedCities: visitedCityNames,
            provinceStats: stats
          });
        }
      },
      fail: err => {
        // 即使失败也不影响页面显示
      }
    });
  },

  /**
   * 跳转到城市详情页
   */
  goToCity: function(e) {
    const cityName = e.currentTarget.dataset.city;
    wx.navigateTo({
      url: `/pages/city/city?cityName=${encodeURIComponent(cityName)}&provinceName=${encodeURIComponent(this.data.provinceName)}`
    });
  },

  /**
   * 检查城市是否已访问
   */
  isCityVisited: function(cityName) {
    return this.data.visitedCities.includes(cityName);
  },

  /**
   * 添加旅行记录
   */
  addTripRecord: function() {
    wx.navigateTo({
      url: `/pages/trip/add?provinceName=${encodeURIComponent(this.data.provinceName)}`
    });
  },

  /**
   * 刷新数据
   */
  refreshData: function() {
    this.loadVisitedCities(this.data.provinceName);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时刷新数据
    this.refreshData();
  }
})