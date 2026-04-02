# 云函数 - 用户登录

```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID, APPID, UNIONID } = wxContext
  
  // 查询用户是否存在
  const userResult = await db.collection('users').where({
    _openid: OPENID
  }).get()
  
  let user
  if (userResult.data.length === 0) {
    // 创建新用户
    const createTime = Date.now()
    await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: event.userInfo?.nickName || '用户',
        avatarUrl: event.userInfo?.avatarUrl || '',
        gender: event.userInfo?.gender || 0,
        city: event.userInfo?.city || '',
        province: event.userInfo?.province || '',
        country: event.userInfo?.country || '',
        createTime,
        lastLoginTime: createTime
      }
    })
    
    user = {
      openid: OPENID,
      appid: APPID,
      unionid: UNIONID,
      isNew: true
    }
  } else {
    // 更新最后登录时间
    await db.collection('users').doc(userResult.data[0]._id).update({
      data: {
        lastLoginTime: Date.now()
      }
    })
    
    user = {
      openid: OPENID,
      appid: APPID,
      unionid: UNIONID,
      isNew: false,
      ...userResult.data[0]
    }
  }
  
  // 查询情侣关系
  const coupleResult = await db.collection('couples').where({
    $or: [
      { 'userA._openid': OPENID },
      { 'userB._openid': OPENID }
    ]
  }).get()
  
  let couple = null
  if (coupleResult.data.length > 0) {
    const coupleData = coupleResult.data[0]
    if (coupleData.status === 'active') {
      couple = coupleData
    }
  }
  
  return {
    success: true,
    user,
    couple
  }
}
```

## 调用示例

```javascript
// 小程序端调用
wx.cloud.callFunction({
  name: 'login',
  data: {
    userInfo: wx.getStorageSync('userInfo')
  },
  success: res => {
    console.log('登录成功', res.result)
    wx.setStorageSync('userInfo', res.result.user)
    if (res.result.couple) {
      wx.setStorageSync('coupleInfo', res.result.couple)
    }
  }
})
```
