// China province coordinates for map display
export interface Province {
  name: string;
  lat: number;
  lng: number;
  adcode: string;
  cities: { name: string; lat: number; lng: number }[];
}

export const PROVINCES: Province[] = [
  {
    name: '北京', lat: 39.9042, lng: 116.4074, adcode: '110000',
    cities: [
      { name: '北京', lat: 39.9042, lng: 116.4074 },
    ],
  },
  {
    name: '上海', lat: 31.2304, lng: 121.4737, adcode: '310000',
    cities: [
      { name: '上海', lat: 31.2304, lng: 121.4737 },
    ],
  },
  {
    name: '广东', lat: 23.1291, lng: 113.2644, adcode: '440000',
    cities: [
      { name: '广州', lat: 23.1291, lng: 113.2644 },
      { name: '深圳', lat: 22.5431, lng: 114.0579 },
      { name: '珠海', lat: 22.2769, lng: 113.5678 },
      { name: '佛山', lat: 23.0218, lng: 113.1219 },
      { name: '东莞', lat: 23.0209, lng: 113.7518 },
    ],
  },
  {
    name: '江苏', lat: 32.0603, lng: 118.7969, adcode: '320000',
    cities: [
      { name: '南京', lat: 32.0603, lng: 118.7969 },
      { name: '苏州', lat: 31.2989, lng: 120.5853 },
      { name: '无锡', lat: 31.4912, lng: 120.3119 },
    ],
  },
  {
    name: '浙江', lat: 30.2741, lng: 120.1551, adcode: '330000',
    cities: [
      { name: '杭州', lat: 30.2741, lng: 120.1551 },
      { name: '宁波', lat: 29.8683, lng: 121.544 },
      { name: '温州', lat: 27.9936, lng: 120.6994 },
    ],
  },
  {
    name: '四川', lat: 30.5728, lng: 104.0668, adcode: '510000',
    cities: [
      { name: '成都', lat: 30.5728, lng: 104.0668 },
    ],
  },
  {
    name: '湖北', lat: 30.5928, lng: 114.3055, adcode: '420000',
    cities: [
      { name: '武汉', lat: 30.5928, lng: 114.3055 },
    ],
  },
  {
    name: '湖南', lat: 28.2282, lng: 112.9388, adcode: '430000',
    cities: [
      { name: '长沙', lat: 28.2282, lng: 112.9388 },
    ],
  },
  {
    name: '河南', lat: 34.7466, lng: 113.6253, adcode: '410000',
    cities: [
      { name: '郑州', lat: 34.7466, lng: 113.6253 },
    ],
  },
  {
    name: '山东', lat: 36.6512, lng: 117.1209, adcode: '370000',
    cities: [
      { name: '济南', lat: 36.6512, lng: 117.1209 },
      { name: '青岛', lat: 36.0671, lng: 120.3826 },
    ],
  },
  {
    name: '河北', lat: 38.0428, lng: 114.5149, adcode: '130000',
    cities: [
      { name: '石家庄', lat: 38.0428, lng: 114.5149 },
    ],
  },
  {
    name: '福建', lat: 26.0745, lng: 119.2965, adcode: '350000',
    cities: [
      { name: '福州', lat: 26.0745, lng: 119.2965 },
      { name: '厦门', lat: 24.4798, lng: 118.0894 },
    ],
  },
  {
    name: '安徽', lat: 31.8612, lng: 117.2826, adcode: '340000',
    cities: [
      { name: '合肥', lat: 31.8612, lng: 117.2826 },
    ],
  },
  {
    name: '陕西', lat: 34.3416, lng: 108.9398, adcode: '610000',
    cities: [
      { name: '西安', lat: 34.3416, lng: 108.9398 },
    ],
  },
  {
    name: '江西', lat: 28.6829, lng: 115.8579, adcode: '360000',
    cities: [
      { name: '南昌', lat: 28.6829, lng: 115.8579 },
    ],
  },
  {
    name: '重庆', lat: 29.5630, lng: 106.5516, adcode: '500000',
    cities: [
      { name: '重庆', lat: 29.5630, lng: 106.5516 },
    ],
  },
  {
    name: '辽宁', lat: 41.8057, lng: 123.4328, adcode: '210000',
    cities: [
      { name: '沈阳', lat: 41.8057, lng: 123.4328 },
      { name: '大连', lat: 38.9140, lng: 121.6147 },
    ],
  },
  {
    name: '云南', lat: 25.0406, lng: 102.7125, adcode: '530000',
    cities: [
      { name: '昆明', lat: 25.0406, lng: 102.7125 },
      { name: '大理', lat: 25.6065, lng: 100.2677 },
      { name: '丽江', lat: 26.8721, lng: 100.2334 },
    ],
  },
  {
    name: '广西', lat: 22.8155, lng: 108.3275, adcode: '450000',
    cities: [
      { name: '南宁', lat: 22.8155, lng: 108.3275 },
      { name: '桂林', lat: 25.2736, lng: 110.2904 },
    ],
  },
  {
    name: '山西', lat: 37.8706, lng: 112.5489, adcode: '140000',
    cities: [
      { name: '太原', lat: 37.8706, lng: 112.5489 },
    ],
  },
  {
    name: '天津', lat: 39.3434, lng: 117.3616, adcode: '120000',
    cities: [
      { name: '天津', lat: 39.3434, lng: 117.3616 },
    ],
  },
  {
    name: '贵州', lat: 26.6470, lng: 106.6302, adcode: '520000',
    cities: [
      { name: '贵阳', lat: 26.6470, lng: 106.6302 },
    ],
  },
  {
    name: '甘肃', lat: 36.0611, lng: 103.8343, adcode: '620000',
    cities: [
      { name: '兰州', lat: 36.0611, lng: 103.8343 },
    ],
  },
  {
    name: '吉林', lat: 43.8171, lng: 125.3235, adcode: '220000',
    cities: [
      { name: '长春', lat: 43.8171, lng: 125.3235 },
    ],
  },
  {
    name: '新疆', lat: 43.8171, lng: 87.6277, adcode: '650000',
    cities: [
      { name: '乌鲁木齐', lat: 43.8171, lng: 87.6277 },
    ],
  },
  {
    name: '海南', lat: 20.0444, lng: 110.3972, adcode: '460000',
    cities: [
      { name: '海口', lat: 20.0444, lng: 110.3972 },
      { name: '三亚', lat: 18.2528, lng: 109.5117 },
    ],
  },
  {
    name: '内蒙古', lat: 40.8414, lng: 111.7519, adcode: '150000',
    cities: [
      { name: '呼和浩特', lat: 40.8414, lng: 111.7519 },
    ],
  },
  {
    name: '黑龙江', lat: 45.8038, lng: 126.5350, adcode: '230000',
    cities: [
      { name: '哈尔滨', lat: 45.8038, lng: 126.5350 },
    ],
  },
  {
    name: '宁夏', lat: 38.4872, lng: 106.2309, adcode: '640000',
    cities: [
      { name: '银川', lat: 38.4872, lng: 106.2309 },
    ],
  },
  {
    name: '青海', lat: 36.6171, lng: 101.7782, adcode: '630000',
    cities: [
      { name: '西宁', lat: 36.6171, lng: 101.7782 },
    ],
  },
  {
    name: '西藏', lat: 29.6500, lng: 91.1409, adcode: '540000',
    cities: [
      { name: '拉萨', lat: 29.6500, lng: 91.1409 },
    ],
  },
  {
    name: '台湾', lat: 25.0330, lng: 121.5654, adcode: '710000',
    cities: [
      { name: '台北', lat: 25.0330, lng: 121.5654 },
    ],
  },
  {
    name: '香港', lat: 22.3193, lng: 114.1694, adcode: '810000',
    cities: [
      { name: '香港', lat: 22.3193, lng: 114.1694 },
    ],
  },
  {
    name: '澳门', lat: 22.1987, lng: 113.5439, adcode: '820000',
    cities: [
      { name: '澳门', lat: 22.1987, lng: 113.5439 },
    ],
  },
];

export const TOTAL_PROVINCES = PROVINCES.length;

/** Get province by display name */
export function getProvinceByName(name: string): Province | undefined {
  return PROVINCES.find((p) => p.name === name);
}
