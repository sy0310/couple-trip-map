const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 旅行记录相关操作
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'add':
      return await handleAddTrip(event, wxContext);
    case 'list':
      return await handleListTrips(event, wxContext);
    case 'update':
      return await handleUpdateTrip(event, wxContext);
    case 'delete':
      return await handleDeleteTrip(event, wxContext);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};

/**
 * 添加旅行记录
 */
async function handleAddTrip(event, wxContext) {
  const openid = wxContext.OPENID;
  const { locationName, coordinates, visitTime, photos, notes, province, city, scenicSpot } = event;

  try {
    // 验证必要字段
    if (!locationName || !coordinates || !visitTime) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }

    // 检查用户是否已绑定情侣关系
    const coupleCheck = await db.collection('couples')
      .where(_.or([
        { partner1_openid: openid },
        { partner2_openid: openid }
      ]))
      .get();

    if (coupleCheck.data.length === 0) {
      return {
        success: false,
        message: '请先绑定情侣关系'
      };
    }

    // 添加旅行记录
    const result = await db.collection('trips').add({
      data: {
        locationName,
        coordinates,
        visitTime: new Date(visitTime),
        photos: photos || [],
        notes: notes || '',
        province: province || '',
        city: city || '',
        scenicSpot: scenicSpot || '',
        creator_openid: openid,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
    });

    return {
      success: true,
      message: '旅行记录添加成功',
      data: {
        tripId: result._id
      }
    };
  } catch (error) {
    console.error('添加旅行记录失败', error);
    return {
      success: false,
      message: '添加失败，请稍后重试'
    };
  }
}

/**
 * 获取旅行列表
 */
async function handleListTrips(event, wxContext) {
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 20, province, city, startDate, endDate } = event;

  try {
    // 构建查询条件
    let queryCondition = _.or([
      { creator_openid: openid }
    ]);

    // 检查用户是否已绑定情侣关系
    const coupleCheck = await db.collection('couples')
      .where(_.or([
        { partner1_openid: openid },
        { partner2_openid: openid }
      ]))
      .get();

    if (coupleCheck.data.length > 0) {
      // 如果已绑定情侣关系，可以查看情侣的旅行记录
      const couple = coupleCheck.data[0];
      const partnerOpenid = couple.partner1_openid === openid 
        ? couple.partner2_openid 
        : couple.partner1_openid;

      if (partnerOpenid) {
        queryCondition = _.or([
          { creator_openid: openid },
          { creator_openid: partnerOpenid }
        ]);
      }
    }

    // 构建查询
    let query = db.collection('trips').where(queryCondition);

    // 添加筛选条件
    if (province) {
      query = query.where({ province });
    }
    if (city) {
      query = query.where({ city });
    }
    if (startDate && endDate) {
      query = query.where({
        visitTime: _.gte(new Date(startDate)).lte(new Date(endDate))
      });
    }

    // 执行查询
    const result = await query
      .orderBy('visitTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 获取总数
    const countResult = await query.count();

    return {
      success: true,
      data: {
        trips: result.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    };
  } catch (error) {
    console.error('获取旅行列表失败', error);
    return {
      success: false,
      message: '获取失败，请稍后重试'
    };
  }
}

/**
 * 更新旅行记录
 */
async function handleUpdateTrip(event, wxContext) {
  const openid = wxContext.OPENID;
  const { tripId, locationName, coordinates, visitTime, photos, notes, province, city, scenicSpot } = event;

  try {
    // 查找旅行记录
    const tripQuery = await db.collection('trips').doc(tripId).get();

    if (!tripQuery.data) {
      return {
        success: false,
        message: '旅行记录不存在'
      };
    }

    const trip = tripQuery.data;

    // 检查权限（只有创建者可以修改）
    if (trip.creator_openid !== openid) {
      return {
        success: false,
        message: '无权限修改'
      };
    }

    // 更新旅行记录
    await db.collection('trips').doc(tripId).update({
      data: {
        locationName: locationName || trip.locationName,
        coordinates: coordinates || trip.coordinates,
        visitTime: visitTime ? new Date(visitTime) : trip.visitTime,
        photos: photos !== undefined ? photos : trip.photos,
        notes: notes !== undefined ? notes : trip.notes,
        province: province !== undefined ? province : trip.province,
        city: city !== undefined ? city : trip.city,
        scenicSpot: scenicSpot !== undefined ? scenicSpot : trip.scenicSpot,
        updated_at: db.serverDate()
      }
    });

    return {
      success: true,
      message: '旅行记录更新成功'
    };
  } catch (error) {
    console.error('更新旅行记录失败', error);
    return {
      success: false,
      message: '更新失败，请稍后重试'
    };
  }
}

/**
 * 删除旅行记录
 */
async function handleDeleteTrip(event, wxContext) {
  const openid = wxContext.OPENID;
  const { tripId } = event;

  try {
    // 查找旅行记录
    const tripQuery = await db.collection('trips').doc(tripId).get();

    if (!tripQuery.data) {
      return {
        success: false,
        message: '旅行记录不存在'
      };
    }

    const trip = tripQuery.data;

    // 检查权限（只有创建者可以删除）
    if (trip.creator_openid !== openid) {
      return {
        success: false,
        message: '无权限删除'
      };
    }

    // 删除旅行记录
    await db.collection('trips').doc(tripId).remove();

    return {
      success: true,
      message: '旅行记录删除成功'
    };
  } catch (error) {
    console.error('删除旅行记录失败', error);
    return {
      success: false,
      message: '删除失败，请稍后重试'
    };
  }
}