export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/album/index',
    'pages/stats/index',
    'pages/profile/index',
    'pages/link-account/index',
    'pages/poster/index',
    'pages/trip-edit/index',
    'pages/profile-edit/index'
  ],
  subPackages: [
    { root: 'packageProvince', pages: ['pages/province/index'] },
    { root: 'packageCity', pages: ['pages/city/index'] }
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#4A7C59',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/index/index', text: '地图', iconPath: './assets/tab-map.png', selectedIconPath: './assets/tab-map-active.png' },
      { pagePath: 'pages/album/index', text: '相册', iconPath: './assets/tab-album.png', selectedIconPath: './assets/tab-album-active.png' },
      { pagePath: 'pages/stats/index', text: '统计', iconPath: './assets/tab-stats.png', selectedIconPath: './assets/tab-stats-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: './assets/tab-profile.png', selectedIconPath: './assets/tab-profile-active.png' }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5EFE4',
    navigationBarTitleText: '遇亭',
    navigationBarTextStyle: 'black'
  }
})
