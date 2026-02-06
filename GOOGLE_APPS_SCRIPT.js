// ==========================================
// 1. Update this code in Google Apps Script Editor
// 2. Deploy -> New deployment -> Web app
// 3. Execute as: Me, Access: Anyone
// ==========================================

const FOLDER_ID = "1e9YhN5GHtDdKHqoqkkeSKu8jECAUeY74"; 
const GOOGLE_CHAT_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAGauDZf0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=U6Oeox5kfhDz7X-zlQ4ScTQv3Kn6B5lOfK3_w4T_EnM";
const CACHE_KEY_PRODUCTS = "products_json";

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  let action = e.parameter.action;
  let params = e.parameter;
  
  if (e.postData && e.postData.contents) {
    const postData = JSON.parse(e.postData.contents);
    action = postData.action || action;
    params = postData;
  }

  // Fast Read (No Lock)
  if (action === "getProducts") {
    return responseJSON(getProductsWithCache());
  } else if (action === "getOrders") {
    return responseJSON(getOrders());
  }

  // Safe Write (With Lock)
  try {
    if (lock.tryLock(10000)) { // Reduced lock wait time
      const doc = SpreadsheetApp.getActiveSpreadsheet();

      if (action === "saveProduct") {
        const res = saveProduct(doc, params.data);
        CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
        return responseJSON(res);
      } else if (action === "deleteProduct") {
        const res = deleteProduct(doc, params.id);
        CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
        return responseJSON(res);
      } else if (action === "createOrder") {
        return responseJSON(createOrder(doc, params.data, params.slipImage));
      } else if (action === "updateOrderStatus") {
        return responseJSON(updateOrderStatus(doc, params.id, params.status));
      } else if (action === "updateOrderPayment") {
        return responseJSON(updateOrderPayment(doc, params.id, params.slipImage));
      }
      return responseJSON({ status: "error", message: "Invalid action" });
    } else {
      return responseJSON({ status: "error", message: "Server busy, try again" });
    }
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function sendChatNotification(message) {
  if (!GOOGLE_CHAT_WEBHOOK_URL) return;
  try {
    UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify({ "text": message })
    });
  } catch (e) {}
}

function getProductsWithCache() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY_PRODUCTS);
  if (cached) return JSON.parse(cached);
  
  const products = getProducts(SpreadsheetApp.getActiveSpreadsheet());
  cache.put(CACHE_KEY_PRODUCTS, JSON.stringify(products), 1200);
  return products;
}

function getProducts(doc) {
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

  // Upload Images
  if (isBase64(product.image)) product.image = uploadImageToDrive(product.image, "PROD_" + product.id);
  
  if (product.additionalImages) {
    product.additionalImages = product.additionalImages.map((img, idx) => 
      isBase64(img) ? uploadImageToDrive(img, `PROD_EXT_${product.id}_${idx}`) : img
    );
  }

  const rowData = [
    product.id, product.name, product.category, JSON.stringify(product.prices),
    product.description, product.image, JSON.stringify(product.additionalImages || []),
    product.video || "", product.isPopular
  ];

  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(product.id)) { rowIndex = i + 1; break; }
  }

  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  else sheet.appendRow(rowData);
  
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

function createOrder(doc, order, slipImage) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const headers = ["id", "customerName", "userType", "items", "totalAmount", "paymentMethod", "deliveryLocation", "status", "slipUrl", "timestamp"];
  ensureHeaders(sheet, headers);

  let slipUrl = "";
  if (isBase64(slipImage)) slipUrl = uploadImageToDrive(slipImage, "SLIP_" + order.id);

  sheet.appendRow([
    order.id, order.customerName, order.userType, JSON.stringify(order.items),
    order.totalAmount, order.paymentMethod, order.deliveryLocation, order.status,
    slipUrl, order.timestamp
  ]);

  let itemDetails = order.items.map(i => `• ${i.name} x${i.quantity}`).join("\n");
  sendChatNotification(`🛍️ *New Order* (${order.id})\nCustomer: ${order.customerName}\nItems:\n${itemDetails}\nTotal: ${order.totalAmount}`);

  return { status: "success", slipUrl: slipUrl };
}

function updateOrderStatus(doc, id, status) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf("id");
  const statusIdx = rows[0].indexOf("status");

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      sendChatNotification(`🔄 *Status Update* (${id}) -> ${status}`);
      break;
    }
  }
  return { status: "success" };
}

function updateOrderPayment(doc, id, slipImage) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf("id");
  const methodIdx = rows[0].indexOf("paymentMethod");
  const slipIdx = rows[0].indexOf("slipUrl");

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      let slipUrl = "";
      if (isBase64(slipImage)) slipUrl = uploadImageToDrive(slipImage, "SLIP_PAY_" + id);
      
      sheet.getRange(i + 1, methodIdx + 1).setValue("โอนชำระ");
      sheet.getRange(i + 1, slipIdx + 1).setValue(slipUrl);
      
      sendChatNotification(`💸 *Payment Received* (${id})`);
      break;
    }
  }
  return { status: "success" };
}

// Helpers
function isBase64(str) {
  return str && typeof str === 'string' && str.length > 200 && str.includes('base64');
}

function uploadImageToDrive(base64Data, fileName) {
  try {
    const split = base64Data.split('base64,');
    if (split.length < 2) return base64Data;
    const type = split[0].split(':')[1].split(';')[0];
    const blob = Utilities.newBlob(Utilities.base64Decode(split[1]), type, fileName);
    const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (e) { return "Error: " + e.toString(); }
}

function getOrCreateSheet(doc, name) {
  let sheet = doc.getSheetByName(name);
  if (!sheet) sheet = doc.insertSheet(name);
  return sheet;
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function getData(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}