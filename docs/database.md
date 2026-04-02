# 数据库设计文档

## 集合列表

| 集合名 | 说明 | 主要字段 |
|--------|------|---------|
| `users` | 用户信息 | _openid, nickName, avatarUrl, createTime |
| `couples` | 情侣关系 | userA, userB, status, inviteCode, createTime |
| `trips` | 旅行记录 | coupleId, locationId, visitDate, isPublic, createTime |
| `locations` | 地点信息 | name, level, parentId, lat, lng, province, city |
| `photos` | 照片记录 | tripId, fileID, takenAt, uploadedBy, caption |

---

## 详细 Schema

### users (用户)

```json
{
  "_id": "auto",
  "_openid": "wx_xxx",
  "nickName": "船长",
  "avatarUrl": "https://xxx",
  "gender": 1,
  "city": "北京",
  "province": "北京",
  "country": "中国",
  "createTime": 1775154361000,
  "lastLoginTime": 1775154361000
}
```

### couples (情侣关系)

```json
{
  "_id": "auto",
  "_openid": "wx_xxx",
  "userA": {
    "_openid": "wx_xxx",
    "nickName": "船长",
    "avatarUrl": "https://xxx"
  },
  "userB": {
    "_openid": "wx_yyy",
    "nickName": "船员",
    "avatarUrl": "https://yyy"
  },
  "status": "active",  // active, pending, separated
  "inviteCode": "LOVE2026",
  "inviteBy": "userA",
  "createTime": 1775154361000,
  "acceptTime": 1775154361000
}
```

### trips (旅行记录)

```json
{
  "_id": "auto",
  "_openid": "wx_xxx",
  "coupleId": "couple_xxx",
  "locationId": "loc_beijing",
  "locationName": "北京市",
  "province": "北京",
  "city": "北京",
  "spot": "故宫",
  "visitDate": 1775154361000,
  "isPublic": false,
  "photoCount": 12,
  "mileage": 1200,  // 里程（可选）
  "note": "第一次一起来北京",
  "createTime": 1775154361000,
  "updateTime": 1775154361000
}
```

### locations (地点)

```json
{
  "_id": "loc_beijing",
  "name": "北京市",
  "level": "province",  // province, city, spot
  "parentId": null,
  "lat": 39.9042,
  "lng": 116.4074,
  "province": "北京",
  "city": "",
  "spot": ""
}
```

### photos (照片)

```json
{
  "_id": "auto",
  "_openid": "wx_xxx",
  "tripId": "trip_xxx",
  "fileID": "cloud://xxx",
  "cdnUrl": "https://xxx",
  "thumbnailUrl": "https://xxx?thumbnail",
  "takenAt": 1775154361000,
  "uploadedBy": "wx_xxx",
  "caption": "我们在故宫门口",
  "width": 1920,
  "height": 1080,
  "size": 2048000,
  "createTime": 1775154361000
}
```

---

## 索引建议

```javascript
// couples
db.collection('couples').createIndex({ userA: 1 })
db.collection('couples').createIndex({ userB: 1 })
db.collection('couples').createIndex({ inviteCode: 1 })

// trips
db.collection('trips').createIndex({ coupleId: 1 })
db.collection('trips').createIndex({ locationId: 1 })
db.collection('trips').createIndex({ visitDate: -1 })
db.collection('trips').createIndex({ province: 1, city: 1 })

// photos
db.collection('photos').createIndex({ tripId: 1 })
db.collection('photos').createIndex({ takenAt: -1 })
```

---

## 云函数列表

| 函数名 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| `login` | 用户登录 | - | userInfo |
| `createCouple` | 创建情侣关系 | inviteCode | coupleId |
| `acceptInvite` | 接受邀请 | inviteCode, userId | coupleId |
| `addTrip` | 添加旅行记录 | location, date, photos | tripId |
| `uploadPhoto` | 上传照片 | tempFilePath | fileID |
| `getTrips` | 获取旅行列表 | coupleId, page, size | trips[] |
| `getStats` | 获取统计数据 | coupleId | stats |

---

## 权限规则

```javascript
// 云数据库权限
{
  "read": "auth.openid == doc._openid || auth.openid in doc.coupleMembers",
  "write": "auth.openid == doc._openid"
}

// 云存储权限
// 默认仅创建者可读写
// 情侣共享需通过云函数代理访问
}
```
