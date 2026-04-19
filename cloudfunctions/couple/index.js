const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 情侣关系相关操作
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'bind':
      return await handleBind(event, wxContext);
    case 'check':
      return await handleCheck(wxContext);
    case 'unbind':
      return await handleUnbind(wxContext);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};

/**
 * 处理绑定操作
 */
async function handleBind(event, wxContext) {
  const { action: bindAction, bindCode } = event;
  const openid = wxContext.OPENID;

  try {
    if (bindAction === 'create') {
      // 创建情侣关系
      const existingBinding = await db.collection('couples')
        .where(_.or([
          { partner1_openid: openid },
          { partner2_openid: openid }
        ]))
        .get();

      if (existingBinding.data.length > 0) {
        return {
          success: false,
          message: '您已经处于情侣关系中'
        };
      }

      // 生成唯一的绑定码
      const bindingCode = generateUniqueCode();
      
      // 创建情侣记录
      await db.collection('couples').add({
        data: {
          binding_code: bindingCode,
          partner1_openid: openid,
          partner1_joined: true,
          partner2_openid: null,
          partner2_joined: false,
          created_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      });

      return {
        success: true,
        message: '情侣关系创建成功',
        data: {
          binding_code: bindingCode
        }
      };

    } else if (bindAction === 'join') {
      // 加入情侣关系
      if (!bindCode) {
        return {
          success: false,
          message: '请输入绑定码'
        };
      }

      // 查找待加入的情侣记录
      const couples = await db.collection('couples')
        .where({
          binding_code: bindCode,
          partner2_openid: null,
          partner2_joined: false
        })
        .get();

      if (couples.data.length === 0) {
        return {
          success: false,
          message: '绑定码无效或已被使用'
        };
      }

      const couple = couples.data[0];

      if (couple.partner1_openid === openid) {
        return {
          success: false,
          message: '您不能加入自己的情侣关系'
        };
      }

      // 更新情侣记录，添加第二个伙伴
      await db.collection('couples').doc(couple._id).update({
        data: {
          partner2_openid: openid,
          partner2_joined: true,
          updated_at: db.serverDate()
        }
      });

      // 获取双方用户信息
      const users = await db.collection('users')
        .where(_.or([
          { openid: couple.partner1_openid },
          { openid: openid }
        ]))
        .get();

      const partner1Info = users.data.find(user => user.openid === couple.partner1_openid);
      const partner2Info = users.data.find(user => user.openid === openid);

      return {
        success: true,
        message: '成功加入情侣关系',
        data: {
          binding_code: bindCode,
          partner1: {
            openid: couple.partner1_openid,
            nickname: partner1Info?.nickname || 'Partner 1',
            avatar: partner1Info?.avatar || ''
          },
          partner2: {
            openid: openid,
            nickname: partner2Info?.nickname || 'Partner 2',
            avatar: partner2Info?.avatar || ''
          }
        }
      };
    } else {
      return {
        success: false,
        message: '未知绑定操作'
      };
    }
  } catch (error) {
    console.error('绑定操作失败', error);
    return {
      success: false,
      message: '操作失败，请稍后重试'
    };
  }
}

/**
 * 检查情侣状态
 */
async function handleCheck(wxContext) {
  const openid = wxContext.OPENID;

  try {
    // 查找用户所在的情侣关系
    const couples = await db.collection('couples')
      .where(_.or([
        { partner1_openid: openid },
        { partner2_openid: openid }
      ]))
      .get();

    if (couples.data.length === 0) {
      return {
        success: true,
        data: null
      };
    }

    const couple = couples.data[0];
    const isPartner1 = couple.partner1_openid === openid;
    
    // 获取伴侣信息
    const partnerOpenid = isPartner1 ? couple.partner2_openid : couple.partner1_openid;
    
    let partnerInfo = {};
    if (partnerOpenid) {
      const users = await db.collection('users')
        .where({ openid: partnerOpenid })
        .get();
        
      if (users.data.length > 0) {
        partnerInfo = {
          openid: partnerOpenid,
          nickname: users.data[0].nickname,
          avatar: users.data[0].avatar
        };
      }
    }

    return {
      success: true,
      data: {
        binding_code: couple.binding_code,
        partner_info: partnerInfo,
        created_at: couple.created_at
      }
    };
  } catch (error) {
    console.error('检查情侣状态失败', error);
    return {
      success: false,
      message: '检查状态失败'
    };
  }
}

/**
 * 解除情侣关系
 */
async function handleUnbind(wxContext) {
  const openid = wxContext.OPENID;

  try {
    // 查找用户所在的情侣关系
    const couples = await db.collection('couples')
      .where(_.or([
        { partner1_openid: openid },
        { partner2_openid: openid }
      ]))
      .get();

    if (couples.data.length === 0) {
      return {
        success: false,
        message: '未找到情侣关系'
      };
    }

    const couple = couples.data[0];
    
    // 删除情侣关系
    await db.collection('couples').doc(couple._id).remove();

    return {
      success: true,
      message: '情侣关系已解除'
    };
  } catch (error) {
    console.error('解除情侣关系失败', error);
    return {
      success: false,
      message: '解除失败，请稍后重试'
    };
  }
}

/**
 * 生成唯一绑定码
 */
async function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let attempts = 0;
  while (attempts < 10) {
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await db.collection('couples').where({ binding_code: result }).get();
    if (existing.data.length === 0) return result;
    attempts++;
  }
  throw new Error('生成绑定码失败，请稍后重试');
}