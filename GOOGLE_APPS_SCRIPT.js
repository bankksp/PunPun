// ==========================================
// 1. ไปที่ Google Sheets -> Extensions -> Apps Script
// 2. ลบโค้ดเก่าออกให้หมด แล้ววางโค้ดนี้ลงไป
// 3. กด Deploy -> New deployment -> Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL ที่ได้ ไปใส่ในไฟล์ constants.ts
// ==========================================

// ID ของโฟลเดอร์ Google Drive สำหรับเก็บรูปสลิปและรูปสินค้า
const FOLDER_ID = "1e9YhN5GHtDdKHqoqkkeSKu8jECAUeY74"; 

// Google Chat Webhook URL
const GOOGLE_CHAT_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAGauDZf0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=U6Oeox5kfhDz7X-zlQ4ScTQv3Kn6B5lOfK3_w4T_EnM";

// Cache Keys
const CACHE_KEY_PRODUCTS = "products_json";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Reduce wait time to fail faster if needed, but for writes we need safety
  // For reads we should avoid lock if using cache
  
  let action = e.parameter.action;
  let params = e.parameter;
  
  if (e.postData && e.postData.contents) {
    const postData = JSON.parse(e.postData.contents);
    action = postData.action || action;
    params = postData;
  }

  // READ actions: Try not to use Lock if possible, or use Cache
  if (action === "getProducts") {
    return responseJSON(getProductsWithCache());
  } else if (action === "getOrders") {
    // Orders change frequently, better not to cache too aggressively on server or strictly lock
    return responseJSON(getOrders());
  }

  // WRITE actions: Use Lock
  try {
    lock.tryLock(20000); 

    const doc = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "saveProduct") {
      const res = saveProduct(doc, params.data);
      // Invalidate Cache
      CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
      return responseJSON(res);
    } else if (action === "deleteProduct") {
      const res = deleteProduct(doc, params.id);
      // Invalidate Cache
      CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
      return responseJSON(res);
    } else if (action === "createOrder") {
      return responseJSON(createOrder(doc, params.data, params.slipImage));
    } else if (action === "updateOrderStatus") {
      return responseJSON(updateOrderStatus(doc, params.id, params.status));
    } else if (action === "updateOrderPayment") {
      return responseJSON(updateOrderPayment(doc, params.id, params.slipImage));
    }

    return responseJSON({ status: "error", message: "Invalid action: " + action });

  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------------
// Notification Helper
// -------------------------------------------------------------------
function sendChatNotification(message) {
  if (!GOOGLE_CHAT_WEBHOOK_URL) return;
  
  try {
    const payload = {
      "text": message
    };
    
    const options = {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify(payload)
    };
    
    UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, options);
  } catch (e) {
    console.error("Failed to send Chat notification: " + e.toString());
  }
}

// -------------------------------------------------------------------
// Logic Functions
// -------------------------------------------------------------------

function getProductsWithCache() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY_PRODUCTS);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const products = getProducts(doc);
  
  // Cache for 20 minutes (1200 seconds)
  cache.put(CACHE_KEY_PRODUCTS, JSON.stringify(products), 1200);
  
  return products;
}

function getProducts(doc) {
  // Use active doc if passed, otherwise get it (for cache miss scenarios)
  if (!doc) doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(doc, "Products");
  const data = getData(sheet);
  return data.map(row => ({
    ...row,
    prices: row.prices ? JSON.parse(row.prices) : {},
    additionalImages: row.additionalImages ? JSON.parse(row.additionalImages) : [],
    isPopular: String(row.isPopular).toLowerCase() === "true"
  }));
}

function saveProduct(doc, product) {
  const sheet = getOrCreateSheet(doc, "Products");
  const headers = ["id", "name", "category", "prices", "description", "image", "additionalImages", "video", "isPopular"];
  ensureHeaders(sheet, headers);

  // Handle Image Uploads (If Base64 is sent)
  if (product.image && product.image.length > 200 && product.image.startsWith('data:image')) {
    product.image = uploadImageToDrive(product.image, "PROD_COVER_" + product.id);
  }

  // Handle Additional Images
  if (product.additionalImages && Array.isArray(product.additionalImages)) {
    product.additionalImages = product.additionalImages.map((img, idx) => {
       if (img && img.length > 200 && img.startsWith('data:image')) {
          return uploadImageToDrive(img, "PROD_EXTRA_" + product.id + "_" + idx);
       }
       return img;
    });
  }
  
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  if (product.id) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(product.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const rowData = [
    product.id,
    product.name,
    product.category,
    JSON.stringify(product.prices),
    product.description,
    product.image,
    JSON.stringify(product.additionalImages || []),
    product.video || "",
    product.isPopular
  ];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { status: "success" };
}

function deleteProduct(doc, id) {
  const sheet = getOrCreateSheet(doc, "Products");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { status: "success" };
}

function getOrders(doc) {
  if (!doc) doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(doc, "Orders");
  const data = getData(sheet);
  return data.map(row => ({
    ...row,
    items: row.items ? JSON.parse(row.items) : [],
    timestamp: Number(row.timestamp)
  }));
}

function createOrder(doc, order, slipImageBase64) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const headers = ["id", "customerName", "userType", "items", "totalAmount", "paymentMethod", "deliveryLocation", "status", "slipUrl", "timestamp"];
  ensureHeaders(sheet, headers);

  let slipUrl = "";
  if (slipImageBase64) {
    try {
      slipUrl = uploadImageToDrive(slipImageBase64, "SLIP_" + order.id);
    } catch (e) {
      slipUrl = "Error Uploading Slip: " + e.toString();
    }
  }

  const rowData = [
    order.id,
    order.customerName,
    order.userType,
    JSON.stringify(order.items),
    order.totalAmount,
    order.paymentMethod,
    order.deliveryLocation,
    order.status,
    slipUrl,
    order.timestamp
  ];

  sheet.appendRow(rowData);

  // Notify Google Chat
  let itemDetails = "";
  order.items.forEach(item => {
    itemDetails += `• ${item.name} (${item.selectedServingType}) x${item.quantity} [${item.sweetness}]\n`;
  });

  const chatMsg = `🛍️ *มีออเดอร์ใหม่!* (${order.id})\n` +
                  `👤 ลูกค้า: ${order.customerName} (${order.userType})\n` +
                  `📍 ส่งที่: ${order.deliveryLocation}\n` +
                  `📦 รายการสินค้า:\n${itemDetails}` +
                  `💰 ยอดรวม: ${order.totalAmount} บาท\n` +
                  `💳 ชำระโดย: ${order.paymentMethod}` + 
                  (slipUrl ? `\n📎 แนบสลิปแล้ว` : ``);

  sendChatNotification(chatMsg);

  return { status: "success", slipUrl: slipUrl };
}

function updateOrderStatus(doc, id, status) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  
  const headerRow = rows[0];
  const idIdx = headerRow.indexOf("id");
  const statusIdx = headerRow.indexOf("status");
  const customerIdx = headerRow.indexOf("customerName"); // To get customer name for notification

  if (idIdx === -1 || statusIdx === -1) return { status: "error" };

  let customerName = "ลูกค้า";

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      if (customerIdx > -1) customerName = rows[i][customerIdx];
      
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      
      // Notify Google Chat
      const emoji = status === "COMPLETED" ? "✅" : status === "CANCELLED" ? "❌" : "🔄";
      const chatMsg = `${emoji} *อัพเดทสถานะออเดอร์* (${id})\n` +
                      `👤 ลูกค้า: ${customerName}\n` +
                      `📢 สถานะใหม่: ${status}`;
      sendChatNotification(chatMsg);

      break;
    }
  }
  return { status: "success" };
}

function updateOrderPayment(doc, id, slipImageBase64) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  
  const headerRow = rows[0];
  const idIdx = headerRow.indexOf("id");
  const methodIdx = headerRow.indexOf("paymentMethod");
  const slipIdx = headerRow.indexOf("slipUrl");
  const customerIdx = headerRow.indexOf("customerName");
  const amountIdx = headerRow.indexOf("totalAmount");

  if (idIdx === -1 || methodIdx === -1 || slipIdx === -1) return { status: "error" };

  let slipUrl = "";
  if (slipImageBase64) {
    try {
      slipUrl = uploadImageToDrive(slipImageBase64, "SLIP_UPDATE_" + id + "_" + Date.now());
    } catch (e) {
      slipUrl = "Error Uploading Slip: " + e.toString();
    }
  }

  let customerName = "ลูกค้า";
  let amount = "0";

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      if (customerIdx > -1) customerName = rows[i][customerIdx];
      if (amountIdx > -1) amount = rows[i][amountIdx];

      // Update Payment Method to Transfer (โอนชำระ)
      sheet.getRange(i + 1, methodIdx + 1).setValue("โอนชำระ");
      // Update Slip URL
      sheet.getRange(i + 1, slipIdx + 1).setValue(slipUrl);

      // Notify Google Chat
      const chatMsg = `💸 *แจ้งชำระเงิน (โอนเงิน)* (${id})\n` +
                      `👤 ลูกค้า: ${customerName}\n` +
                      `💰 ยอดเงิน: ${amount} บาท\n` +
                      `📎 ตรวจสอบสลิปที่แนบมาในระบบ`;
      sendChatNotification(chatMsg);

      break;
    }
  }
  return { status: "success", slipUrl: slipUrl };
}

// -------------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------------

function uploadImageToDrive(base64Data, fileName) {
  try {
    const split = base64Data.split('base64,');
    if (split.length < 2) return base64Data; // Not base64 or invalid
    
    const type = split[0].split(':')[1].split(';')[0];
    const data = Utilities.base64Decode(split[1]);
    const blob = Utilities.newBlob(data, type, fileName);
    
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Use this URL format which is friendly for <img> tags
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (e) {
    return "Error: " + e.toString();
  }
}

function getOrCreateSheet(doc, name) {
  let sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function getData(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    data.push(obj);
  }
  return data;
}