// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx 方法）会默认请求到哪个云环境的资源
        //   此处请填入你的环境 ID，环境 ID 可进入云开发控制台查看
        env: 'your-env-id',  // TODO: 替换为你的云开发环境 ID
        traceUser: true,
      })
    }

    this.globalData = {}
  },

  globalData: {
    userInfo: null,
    coupleInfo: null,
  }
})
