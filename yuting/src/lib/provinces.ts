// China province coordinates for map display
export interface Province {
  name: string;
  lat: number;
  lng: number;
  visited: boolean;
}

export const PROVINCES: Province[] = [
  { name: '北京', lat: 39.9042, lng: 116.4074, visited: false },
  { name: '上海', lat: 31.2304, lng: 121.4737, visited: false },
  { name: '广东', lat: 23.1291, lng: 113.2644, visited: false },
  { name: '江苏', lat: 32.0603, lng: 118.7969, visited: false },
  { name: '浙江', lat: 30.2741, lng: 120.1551, visited: false },
  { name: '四川', lat: 30.5728, lng: 104.0668, visited: false },
  { name: '湖北', lat: 30.5928, lng: 114.3055, visited: false },
  { name: '湖南', lat: 28.2282, lng: 112.9388, visited: false },
  { name: '河南', lat: 34.7466, lng: 113.6253, visited: false },
  { name: '山东', lat: 36.6512, lng: 117.1209, visited: false },
  { name: '河北', lat: 38.0428, lng: 114.5149, visited: false },
  { name: '福建', lat: 26.0745, lng: 119.2965, visited: false },
  { name: '安徽', lat: 31.8612, lng: 117.2826, visited: false },
  { name: '陕西', lat: 34.3416, lng: 108.9398, visited: false },
  { name: '江西', lat: 28.6829, lng: 115.8579, visited: false },
  { name: '重庆', lat: 29.5630, lng: 106.5516, visited: false },
  { name: '辽宁', lat: 41.8057, lng: 123.4328, visited: false },
  { name: '云南', lat: 25.0406, lng: 102.7125, visited: false },
  { name: '广西', lat: 22.8155, lng: 108.3275, visited: false },
  { name: '山西', lat: 37.8706, lng: 112.5489, visited: false },
  { name: '天津', lat: 39.3434, lng: 117.3616, visited: false },
  { name: '贵州', lat: 26.6470, lng: 106.6302, visited: false },
  { name: '甘肃', lat: 36.0611, lng: 103.8343, visited: false },
  { name: '吉林', lat: 43.8171, lng: 125.3235, visited: false },
  { name: '新疆', lat: 43.8171, lng: 87.6277, visited: false },
  { name: '海南', lat: 20.0444, lng: 110.3972, visited: false },
  { name: '内蒙古', lat: 40.8414, lng: 111.7519, visited: false },
  { name: '黑龙江', lat: 45.8038, lng: 126.5350, visited: false },
  { name: '宁夏', lat: 38.4872, lng: 106.2309, visited: false },
  { name: '青海', lat: 36.6171, lng: 101.7782, visited: false },
  { name: '西藏', lat: 29.6500, lng: 91.1409, visited: false },
  { name: '台湾', lat: 25.0330, lng: 121.5654, visited: false },
  { name: '香港', lat: 22.3193, lng: 114.1694, visited: false },
  { name: '澳门', lat: 22.1987, lng: 113.5439, visited: false },
];

export const TOTAL_PROVINCES = PROVINCES.length;
