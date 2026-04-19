const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 照片上传相关操作
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'upload':
      return await handleUploadPhoto(event, wxContext);
    case 'list':
      return await handleListPhotos(event, wxContext);
    case 'delete':
      return await handleDeletePhoto(event, wxContext);
    default:
      return {
        success: false,
        message: '未知操作'
      };
  }
};

/**
 * 上传照片
 */
async function handleUploadPhoto(event, wxContext) {
  const openid = wxContext.OPENID;
  const { fileId, locationId, tripId, description } = event;

  try {
    // 验证参数
    if (!fileId) {
      return {
        success: false,
        message: '缺少文件ID'
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

    // 添加照片记录
    const result = await db.collection('photos').add({
      data: {
        fileId: fileId,  // 云存储文件ID
        locationId: locationId || null,  // 关联位置ID
        tripId: tripId || null,  // 关联旅行记录ID
        uploader_openid: openid,  // 上传者
        description: description || '',  // 描述
        uploaded_at: db.serverDate(),
        updated_at: db.serverDate()
      }
    });

    return {
      success: true,
      message: '照片上传成功',
      data: {
        photoId: result._id,
        fileId: fileId
      }
    };
  } catch (error) {
    console.error('上传照片失败', error);
    return {
      success: false,
      message: '上传失败，请稍后重试'
    };
  }
}

/**
 * 获取照片列表
 */
async function handleListPhotos(event, wxContext) {
  const openid = wxContext.OPENID;
  const { page = 1, pageSize = 20, locationId, tripId, startDate, endDate } = event;

  try {
    // 构建查询条件
    let queryCondition = _.or([
      { uploader_openid: openid }
    ]);

    // 检查用户是否已绑定情侣关系
    const coupleCheck = await db.collection('couples')
      .where(_.or([
        { partner1_openid: openid },
        { partner2_openid: openid }
      ]))
      .get();

    if (coupleCheck.data.length > 0) {
      // 如果已绑定情侣关系，可以查看情侣的照片
      const couple = coupleCheck.data[0];
      const partnerOpenid = couple.partner1_openid === openid 
        ? couple.partner2_openid 
        : couple.partner1_openid;

      if (partnerOpenid) {
        queryCondition = _.or([
          { uploader_openid: openid },
          { uploader_openid: partnerOpenid }
        ]);
      }
    }

    // 构建查询
    let query = db.collection('photos').where(queryCondition);

    // 添加筛选条件
    if (locationId) {
      query = query.where({ locationId });
    }
    if (tripId) {
      query = query.where({ tripId });
    }
    if (startDate && endDate) {
      query = query.where({
        uploaded_at: _.gte(new Date(startDate)).lte(new Date(endDate))
      });
    }

    // 执行查询
    const result = await query
      .orderBy('uploaded_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 获取总数
    const countResult = await query.count();

    return {
      success: true,
      data: {
        photos: result.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    };
  } catch (error) {
    console.error('获取照片列表失败', error);
    return {
      success: false,
      message: '获取失败，请稍后重试'
    };
  }
}

/**
 * 删除照片
 */
async function handleDeletePhoto(event, wxContext) {
  const openid = wxContext.OPENID;
  const { photoId } = event;

  try {
    // 查找照片记录
    const photoQuery = await db.collection('photos').doc(photoId).get();

    if (!photoQuery.data) {
      return {
        success: false,
        message: '照片不存在'
      };
    }

    const photo = photoQuery.data;

    // 检查权限（只有上传者可以删除）
    if (photo.uploader_openid !== openid) {
      return {
        success: false,
        message: '无权限删除'
      };
    }

    // 从云存储删除文件
    try {
      await cloud.deleteFile({
        fileList: [photo.fileId]
      });
    } catch (storageError) {
      console.warn('删除云存储文件失败', storageError);
      // 即使云存储删除失败，也要删除数据库记录
    }

    // 删除照片记录
    await db.collection('photos').doc(photoId).remove();

    return {
      success: true,
      message: '照片删除成功'
    };
  } catch (error) {
    console.error('删除照片失败', error);
    return {
      success: false,
      message: '删除失败，请稍后重试'
    };
  }
}