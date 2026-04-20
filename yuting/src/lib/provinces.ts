// China province coordinates for map display
export interface ScenicSpot {
  name: string;
  lat: number;
  lng: number;
}

export interface City {
  name: string;
  lat: number;
  lng: number;
  adcode?: string;
  scenicSpots?: ScenicSpot[];
}

export interface Province {
  name: string;
  lat: number;
  lng: number;
  adcode: string;
  cities: City[];
}

export const PROVINCES: Province[] = [
  {
    name: '北京', lat: 39.9042, lng: 116.4074, adcode: '110000',
    cities: [
      { name: '北京', lat: 39.9042, lng: 116.4074, adcode: '110000', scenicSpots: [
        { name: '故宫', lat: 39.9163, lng: 116.3972 },
        { name: '颐和园', lat: 39.9980, lng: 116.2750 },
        { name: '天安门广场', lat: 39.9040, lng: 116.3976 },
        { name: '长城', lat: 40.4319, lng: 116.5704 },
        { name: '天坛', lat: 39.8822, lng: 116.4066 },
      ]},
    ],
  },
  {
    name: '上海', lat: 31.2304, lng: 121.4737, adcode: '310000',
    cities: [
      { name: '上海', lat: 31.2304, lng: 121.4737, adcode: '310000', scenicSpots: [
        { name: '外滩', lat: 31.2397, lng: 121.4905 },
        { name: '东方明珠', lat: 31.2450, lng: 121.4997 },
        { name: '豫园', lat: 31.2274, lng: 121.4910 },
        { name: '上海博物馆', lat: 31.2265, lng: 121.4730 },
      ]},
    ],
  },
  {
    name: '广东', lat: 23.1291, lng: 113.2644, adcode: '440000',
    cities: [
      { name: '广州', lat: 23.1291, lng: 113.2644, adcode: '440100', scenicSpots: [
        { name: '广州塔', lat: 23.1065, lng: 113.3225 },
        { name: '陈家祠', lat: 23.1297, lng: 113.2456 },
        { name: '沙面', lat: 23.1080, lng: 113.2432 },
        { name: '珠江夜游', lat: 23.1150, lng: 113.2680 },
      ]},
      { name: '深圳', lat: 22.5431, lng: 114.0579, adcode: '440300', scenicSpots: [
        { name: '世界之窗', lat: 22.5400, lng: 113.9730 },
        { name: '东部华侨城', lat: 22.5930, lng: 114.3130 },
        { name: '梧桐山', lat: 22.6000, lng: 114.1920 },
      ]},
      { name: '珠海', lat: 22.2769, lng: 113.5678, scenicSpots: [
        { name: '长隆海洋王国', lat: 22.1090, lng: 113.5100 },
        { name: '日月贝', lat: 22.2780, lng: 113.5880 },
        { name: '情侣路', lat: 22.2720, lng: 113.5900 },
      ]},
      { name: '佛山', lat: 23.0218, lng: 113.1219, scenicSpots: [
        { name: '祖庙', lat: 23.0290, lng: 113.1120 },
        { name: '西樵山', lat: 22.9290, lng: 112.9680 },
      ]},
      { name: '东莞', lat: 23.0209, lng: 113.7518, scenicSpots: [
        { name: '可园', lat: 23.0380, lng: 113.7430 },
      ]},
    ],
  },
  {
    name: '江苏', lat: 32.0603, lng: 118.7969, adcode: '320000',
    cities: [
      { name: '南京', lat: 32.0603, lng: 118.7969, adcode: '320100', scenicSpots: [
        { name: '中山陵', lat: 32.0580, lng: 118.8570 },
        { name: '夫子庙', lat: 32.0520, lng: 118.7910 },
        { name: '秦淮河', lat: 32.0490, lng: 118.7840 },
        { name: '明孝陵', lat: 32.0650, lng: 118.8580 },
      ]},
      { name: '苏州', lat: 31.2989, lng: 120.5853, scenicSpots: [
        { name: '拙政园', lat: 31.3190, lng: 120.6300 },
        { name: '狮子林', lat: 31.3200, lng: 120.6280 },
        { name: '平江路', lat: 31.3130, lng: 120.6350 },
        { name: '金鸡湖', lat: 31.3000, lng: 120.6900 },
      ]},
      { name: '无锡', lat: 31.4912, lng: 120.3119, scenicSpots: [
        { name: '鼋头渚', lat: 31.4700, lng: 120.2340 },
        { name: '灵山大佛', lat: 31.4180, lng: 120.0900 },
      ]},
    ],
  },
  {
    name: '浙江', lat: 30.2741, lng: 120.1551, adcode: '330000',
    cities: [
      { name: '杭州', lat: 30.2741, lng: 120.1551, adcode: '330100', scenicSpots: [
        { name: '西湖', lat: 30.2420, lng: 120.1490 },
        { name: '灵隐寺', lat: 30.2683, lng: 120.1060 },
        { name: '宋城', lat: 30.2260, lng: 120.1030 },
      ]},
      { name: '宁波', lat: 29.8683, lng: 121.544, scenicSpots: [
        { name: '天一阁', lat: 29.8740, lng: 121.5440 },
        { name: '东钱湖', lat: 29.8050, lng: 121.6420 },
      ]},
      { name: '温州', lat: 27.9936, lng: 120.6994, scenicSpots: [
        { name: '雁荡山', lat: 28.3700, lng: 121.1100 },
      ]},
    ],
  },
  {
    name: '四川', lat: 30.5728, lng: 104.0668, adcode: '510000',
    cities: [
      { name: '成都', lat: 30.5728, lng: 104.0668, adcode: '510100', scenicSpots: [
        { name: '大熊猫基地', lat: 30.7310, lng: 104.1530 },
        { name: '武侯祠', lat: 30.6430, lng: 104.0450 },
        { name: '锦里', lat: 30.6410, lng: 104.0440 },
        { name: '都江堰', lat: 30.9880, lng: 103.6470 },
      ]},
    ],
  },
  {
    name: '湖北', lat: 30.5928, lng: 114.3055, adcode: '420000',
    cities: [
      { name: '武汉', lat: 30.5928, lng: 114.3055, scenicSpots: [
        { name: '黄鹤楼', lat: 30.5460, lng: 114.3060 },
        { name: '东湖', lat: 30.5440, lng: 114.3740 },
        { name: '户部巷', lat: 30.5490, lng: 114.3020 },
        { name: '江汉路', lat: 30.5790, lng: 114.2850 },
      ]},
    ],
  },
  {
    name: '湖南', lat: 28.2282, lng: 112.9388, adcode: '430000',
    cities: [
      { name: '长沙', lat: 28.2282, lng: 112.9388, scenicSpots: [
        { name: '橘子洲', lat: 28.1820, lng: 112.9560 },
        { name: '岳麓山', lat: 28.1850, lng: 112.9250 },
        { name: '太平老街', lat: 28.1920, lng: 112.9700 },
        { name: '湖南省博物馆', lat: 28.2150, lng: 112.9900 },
      ]},
    ],
  },
  {
    name: '河南', lat: 34.7466, lng: 113.6253, adcode: '410000',
    cities: [
      { name: '郑州', lat: 34.7466, lng: 113.6253, scenicSpots: [
        { name: '少林寺', lat: 34.5060, lng: 112.9430 },
        { name: '龙门石窟', lat: 34.5550, lng: 112.4830 },
        { name: '河南博物院', lat: 34.7560, lng: 113.6670 },
      ]},
    ],
  },
  {
    name: '山东', lat: 36.6512, lng: 117.1209, adcode: '370000',
    cities: [
      { name: '济南', lat: 36.6512, lng: 117.1209, scenicSpots: [
        { name: '趵突泉', lat: 36.6610, lng: 117.0160 },
        { name: '大明湖', lat: 36.6680, lng: 117.0220 },
        { name: '千佛山', lat: 36.6390, lng: 117.0300 },
      ]},
      { name: '青岛', lat: 36.0671, lng: 120.3826, scenicSpots: [
        { name: '栈桥', lat: 36.0570, lng: 120.3220 },
        { name: '八大关', lat: 36.0540, lng: 120.3510 },
        { name: '崂山', lat: 36.1570, lng: 120.6240 },
        { name: '五四广场', lat: 36.0660, lng: 120.3840 },
      ]},
    ],
  },
  {
    name: '河北', lat: 38.0428, lng: 114.5149, adcode: '130000',
    cities: [
      { name: '石家庄', lat: 38.0428, lng: 114.5149, scenicSpots: [
        { name: '正定古城', lat: 38.1470, lng: 114.5670 },
        { name: '赵州桥', lat: 37.7530, lng: 114.7670 },
      ]},
    ],
  },
  {
    name: '福建', lat: 26.0745, lng: 119.2965, adcode: '350000',
    cities: [
      { name: '福州', lat: 26.0745, lng: 119.2965, scenicSpots: [
        { name: '三坊七巷', lat: 26.0860, lng: 119.2960 },
        { name: '鼓山', lat: 26.0740, lng: 119.3460 },
      ]},
      { name: '厦门', lat: 24.4798, lng: 118.0894, scenicSpots: [
        { name: '鼓浪屿', lat: 24.4480, lng: 118.0670 },
        { name: '南普陀寺', lat: 24.4400, lng: 118.0920 },
        { name: '厦门大学', lat: 24.4360, lng: 118.0960 },
        { name: '环岛路', lat: 24.4290, lng: 118.1110 },
      ]},
    ],
  },
  {
    name: '安徽', lat: 31.8612, lng: 117.2826, adcode: '340000',
    cities: [
      { name: '合肥', lat: 31.8612, lng: 117.2826, scenicSpots: [
        { name: '三河古镇', lat: 31.5100, lng: 117.2430 },
        { name: '包公园', lat: 31.8540, lng: 117.2970 },
      ]},
    ],
  },
  {
    name: '陕西', lat: 34.3416, lng: 108.9398, adcode: '610000',
    cities: [
      { name: '西安', lat: 34.3416, lng: 108.9398, adcode: '610100', scenicSpots: [
        { name: '兵马俑', lat: 34.3760, lng: 109.2650 },
        { name: '大雁塔', lat: 34.2210, lng: 108.9600 },
        { name: '钟鼓楼', lat: 34.2600, lng: 108.9470 },
        { name: '华清池', lat: 34.3580, lng: 109.2120 },
      ]},
    ],
  },
  {
    name: '江西', lat: 28.6829, lng: 115.8579, adcode: '360000',
    cities: [
      { name: '南昌', lat: 28.6829, lng: 115.8579, scenicSpots: [
        { name: '滕王阁', lat: 28.6800, lng: 115.8800 },
        { name: '八一广场', lat: 28.6740, lng: 115.8920 },
      ]},
    ],
  },
  {
    name: '重庆', lat: 29.5630, lng: 106.5516, adcode: '500000',
    cities: [
      { name: '重庆', lat: 29.5630, lng: 106.5516, adcode: '500000', scenicSpots: [
        { name: '洪崖洞', lat: 29.5640, lng: 106.5780 },
        { name: '解放碑', lat: 29.5560, lng: 106.5780 },
        { name: '磁器口', lat: 29.5830, lng: 106.4490 },
        { name: '长江索道', lat: 29.5580, lng: 106.5880 },
      ]},
    ],
  },
  {
    name: '辽宁', lat: 41.8057, lng: 123.4328, adcode: '210000',
    cities: [
      { name: '沈阳', lat: 41.8057, lng: 123.4328, scenicSpots: [
        { name: '故宫', lat: 41.7960, lng: 123.4520 },
        { name: '张氏帅府', lat: 41.7940, lng: 123.4550 },
        { name: '北陵公园', lat: 41.8350, lng: 123.4230 },
      ]},
      { name: '大连', lat: 38.9140, lng: 121.6147, scenicSpots: [
        { name: '星海广场', lat: 38.8760, lng: 121.5870 },
        { name: '老虎滩', lat: 38.8780, lng: 121.6720 },
        { name: '棒棰岛', lat: 38.8720, lng: 121.6870 },
        { name: '金石滩', lat: 39.0520, lng: 121.9950 },
      ]},
    ],
  },
  {
    name: '云南', lat: 25.0406, lng: 102.7125, adcode: '530000',
    cities: [
      { name: '昆明', lat: 25.0406, lng: 102.7125, scenicSpots: [
        { name: '滇池', lat: 24.9830, lng: 102.6680 },
        { name: '石林', lat: 24.8160, lng: 103.3280 },
        { name: '翠湖公园', lat: 25.0470, lng: 102.7060 },
      ]},
      { name: '大理', lat: 25.6065, lng: 100.2677, scenicSpots: [
        { name: '洱海', lat: 25.7150, lng: 100.1860 },
        { name: '崇圣寺三塔', lat: 25.7010, lng: 100.1510 },
        { name: '大理古城', lat: 25.6950, lng: 100.1620 },
      ]},
      { name: '丽江', lat: 26.8721, lng: 100.2334, scenicSpots: [
        { name: '丽江古城', lat: 26.8720, lng: 100.2340 },
        { name: '玉龙雪山', lat: 27.1250, lng: 100.2290 },
        { name: '泸沽湖', lat: 27.7240, lng: 100.8250 },
      ]},
    ],
  },
  {
    name: '广西', lat: 22.8155, lng: 108.3275, adcode: '450000',
    cities: [
      { name: '南宁', lat: 22.8155, lng: 108.3275, scenicSpots: [
        { name: '青秀山', lat: 22.7830, lng: 108.3680 },
        { name: '南湖公园', lat: 22.8170, lng: 108.3540 },
      ]},
      { name: '桂林', lat: 25.2736, lng: 110.2904, scenicSpots: [
        { name: '漓江', lat: 25.2830, lng: 110.3260 },
        { name: '象鼻山', lat: 25.2670, lng: 110.2930 },
        { name: '阳朔西街', lat: 24.7750, lng: 110.4900 },
        { name: '龙脊梯田', lat: 25.7530, lng: 110.1030 },
      ]},
    ],
  },
  {
    name: '山西', lat: 37.8706, lng: 112.5489, adcode: '140000',
    cities: [
      { name: '太原', lat: 37.8706, lng: 112.5489, scenicSpots: [
        { name: '晋祠', lat: 37.7820, lng: 112.4500 },
        { name: '双塔寺', lat: 37.8550, lng: 112.5770 },
      ]},
    ],
  },
  {
    name: '天津', lat: 39.3434, lng: 117.3616, adcode: '120000',
    cities: [
      { name: '天津', lat: 39.3434, lng: 117.3616, adcode: '120000', scenicSpots: [
        { name: '海河', lat: 39.1380, lng: 117.2330 },
        { name: '古文化街', lat: 39.1430, lng: 117.1980 },
        { name: '天津之眼', lat: 39.1510, lng: 117.1850 },
      ]},
    ],
  },
  {
    name: '贵州', lat: 26.6470, lng: 106.6302, adcode: '520000',
    cities: [
      { name: '贵阳', lat: 26.6470, lng: 106.6302, scenicSpots: [
        { name: '甲秀楼', lat: 26.5700, lng: 106.7150 },
        { name: '黔灵山', lat: 26.5930, lng: 106.6950 },
        { name: '黄果树瀑布', lat: 25.9880, lng: 105.6670 },
      ]},
    ],
  },
  {
    name: '甘肃', lat: 36.0611, lng: 103.8343, adcode: '620000',
    cities: [
      { name: '兰州', lat: 36.0611, lng: 103.8343, scenicSpots: [
        { name: '白塔山', lat: 36.0700, lng: 103.8250 },
        { name: '黄河铁桥', lat: 36.0650, lng: 103.8220 },
        { name: '敦煌莫高窟', lat: 40.0340, lng: 94.7930 },
      ]},
    ],
  },
  {
    name: '吉林', lat: 43.8171, lng: 125.3235, adcode: '220000',
    cities: [
      { name: '长春', lat: 43.8171, lng: 125.3235, scenicSpots: [
        { name: '净月潭', lat: 43.7930, lng: 125.4680 },
        { name: '伪满皇宫', lat: 43.9040, lng: 125.3510 },
      ]},
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
      { name: '海口', lat: 20.0444, lng: 110.3972, scenicSpots: [
        { name: '骑楼老街', lat: 20.0420, lng: 110.3470 },
        { name: '万绿园', lat: 20.0430, lng: 110.3320 },
      ]},
      { name: '三亚', lat: 18.2528, lng: 109.5117, scenicSpots: [
        { name: '天涯海角', lat: 18.2930, lng: 109.3500 },
        { name: '南山寺', lat: 18.2960, lng: 109.2130 },
        { name: '亚龙湾', lat: 18.2290, lng: 109.6350 },
        { name: '蜈支洲岛', lat: 18.3940, lng: 109.7620 },
      ]},
    ],
  },
  {
    name: '内蒙古', lat: 40.8414, lng: 111.7519, adcode: '150000',
    cities: [
      { name: '呼和浩特', lat: 40.8414, lng: 111.7519, scenicSpots: [
        { name: '大召寺', lat: 40.8170, lng: 111.6490 },
        { name: '昭君墓', lat: 40.7470, lng: 111.7100 },
      ]},
    ],
  },
  {
    name: '黑龙江', lat: 45.8038, lng: 126.5350, adcode: '230000',
    cities: [
      { name: '哈尔滨', lat: 45.8038, lng: 126.5350, scenicSpots: [
        { name: '中央大街', lat: 45.7730, lng: 126.6160 },
        { name: '索菲亚教堂', lat: 45.7680, lng: 126.6240 },
        { name: '冰雪大世界', lat: 45.7900, lng: 126.5670 },
        { name: '太阳岛', lat: 45.7960, lng: 126.5700 },
      ]},
    ],
  },
  {
    name: '宁夏', lat: 38.4872, lng: 106.2309, adcode: '640000',
    cities: [
      { name: '银川', lat: 38.4872, lng: 106.2309, scenicSpots: [
        { name: '镇北堡西部影城', lat: 38.6250, lng: 105.9460 },
        { name: '沙湖', lat: 38.8420, lng: 106.3860 },
      ]},
    ],
  },
  {
    name: '青海', lat: 36.6171, lng: 101.7782, adcode: '630000',
    cities: [
      { name: '西宁', lat: 36.6171, lng: 101.7782, scenicSpots: [
        { name: '青海湖', lat: 36.7500, lng: 100.5200 },
        { name: '塔尔寺', lat: 36.5680, lng: 101.5720 },
      ]},
    ],
  },
  {
    name: '西藏', lat: 29.6500, lng: 91.1409, adcode: '540000',
    cities: [
      { name: '拉萨', lat: 29.6500, lng: 91.1409, scenicSpots: [
        { name: '布达拉宫', lat: 29.6550, lng: 91.1180 },
        { name: '大昭寺', lat: 29.6520, lng: 91.1340 },
        { name: '纳木错', lat: 30.7000, lng: 90.5300 },
      ]},
    ],
  },
  {
    name: '台湾', lat: 25.0330, lng: 121.5654, adcode: '710000',
    cities: [
      { name: '台北', lat: 25.0330, lng: 121.5654, scenicSpots: [
        { name: '101大楼', lat: 25.0340, lng: 121.5640 },
        { name: '故宫博物院', lat: 25.0990, lng: 121.5500 },
        { name: '士林夜市', lat: 25.0870, lng: 121.5240 },
        { name: '阳明山', lat: 25.1650, lng: 121.5350 },
      ]},
    ],
  },
  {
    name: '香港', lat: 22.3193, lng: 114.1694, adcode: '810000',
    cities: [
      { name: '香港', lat: 22.3193, lng: 114.1694, scenicSpots: [
        { name: '维多利亚港', lat: 22.2860, lng: 114.1720 },
        { name: '太平山顶', lat: 22.2750, lng: 114.1520 },
        { name: '迪士尼乐园', lat: 22.3130, lng: 114.0410 },
      ]},
    ],
  },
  {
    name: '澳门', lat: 22.1987, lng: 113.5439, adcode: '820000',
    cities: [
      { name: '澳门', lat: 22.1987, lng: 113.5439, scenicSpots: [
        { name: '大三巴牌坊', lat: 22.1970, lng: 113.5420 },
        { name: '威尼斯人', lat: 22.1470, lng: 113.5610 },
        { name: '议事亭前地', lat: 22.1990, lng: 113.5400 },
      ]},
    ],
  },
];

export const TOTAL_PROVINCES = PROVINCES.length;

/** Get province by display name (strips trailing "市" for matching) */
export function getProvinceByName(name: string): Province | undefined {
  const normalized = name.endsWith('市') ? name.slice(0, -1) : name;
  return PROVINCES.find((p) => p.name === normalized);
}

/** Normalize province name by stripping trailing "市" */
export function normalizeProvinceName(name: string): string {
  return name.endsWith('市') ? name.slice(0, -1) : name;
}

/** Get city by name, searching across all provinces */
export function getCityByName(name: string): City | undefined {
  for (const p of PROVINCES) {
    const city = p.cities.find((c) => c.name === name);
    if (city) return city;
  }
  return undefined;
}
