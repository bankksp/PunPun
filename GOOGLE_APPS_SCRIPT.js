

const FOLDER_ID = "1e9YhN5GHtDdKHqoqkkeSKu8jECAUeY74"; 
const GOOGLE_CHAT_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAGauDZf0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=U6Oeox5kfhDz7X-zlQ4ScTQv3Kn6B5lOfK3_w4T_EnM";
const CACHE_KEY_PRODUCTS = "products_json";
const CACHE_KEY_CATEGORIES = "categories_json";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getProducts") return responseJSON(getProductsWithCache());
  if (action === "getOrders") return responseJSON(getOrders());
  if (action === "getCategories") return responseJSON(getCategoriesWithCache());
  
  return responseJSON({ status: "error", message: "Invalid GET action specified: " + action });
}

function doPost(e) {
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return responseJSON({ status: "error", message: "Invalid JSON payload in request body.", errorDetails: err.toString() });
  }
  
  const action = payload.action;
  const lock = LockService.getScriptLock();
  try {
    if (lock.tryLock(15000)) {
      const doc = SpreadsheetApp.getActiveSpreadsheet();

      switch (action) {
        case "saveProduct":
          CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
          return responseJSON(saveProduct(doc, payload.data));
        case "deleteProduct":
          CacheService.getScriptCache().remove(CACHE_KEY_PRODUCTS);
          return responseJSON(deleteProduct(doc, payload.id));
        case "saveCategory":
          CacheService.getScriptCache().remove(CACHE_KEY_CATEGORIES);
          return responseJSON(saveCategory(doc, payload.data));
        case "deleteCategory":
          CacheService.getScriptCache().remove(CACHE_KEY_CATEGORIES);
          return responseJSON(deleteCategory(doc, payload.id));
        case "createOrder":
          return responseJSON(createOrder(doc, payload.data, payload.slipImage));
        case "updateOrderStatus":
          return responseJSON(updateOrderStatus(doc, payload.id, payload.status));
        case "updateOrderPayment":
          return responseJSON(updateOrderPayment(doc, payload.id, payload.slipImage));
        case "updatePaymentStatus":
          return responseJSON(updatePaymentStatus(doc, payload.id, payload.status));
        default:
          return responseJSON({ status: "error", message: "Invalid POST action specified: " + action });
      }
    } else {
      return responseJSON({ status: "error", message: "Server is busy, please try again." });
    }
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString(), stack: err.stack });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function sendChatNotification(message) {
  if (!GOOGLE_CHAT_WEBHOOK_URL) return;
  try { UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_URL, { 'method' : 'post', 'contentType': 'application/json', 'payload' : JSON.stringify({ "text": message }) }); } catch (e) {}
}

function getProductsWithCache() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY_PRODUCTS);
  if (cached) return JSON.parse(cached);
  const products = getProducts(SpreadsheetApp.getActiveSpreadsheet());
  cache.put(CACHE_KEY_PRODUCTS, JSON.stringify(products), 600);
  return products;
}

function getCategoriesWithCache() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY_CATEGORIES);
  if (cached) return JSON.parse(cached);
  const categories = getCategories(SpreadsheetApp.getActiveSpreadsheet());
  cache.put(CACHE_KEY_CATEGORIES, JSON.stringify(categories), 600);
  return categories;
}

function getCategories(doc) {
  const sheet = getOrCreateSheet(doc, "Categories");
  return getData(sheet);
}

function saveCategory(doc, cat) {
  const sheet = getOrCreateSheet(doc, "Categories");
  ensureHeaders(sheet, ["id", "name"]);
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][0]) === String(cat.id)) { rowIndex = i + 1; break; } }
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, 2).setValues([[cat.id, cat.name]]);
  else sheet.appendRow([cat.id, cat.name]);
  return { status: "success" };
}

function deleteCategory(doc, id) {
  const sheet = getOrCreateSheet(doc, "Categories");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); break; } }
  return { status: "success" };
}

function getProducts(doc) {
  const sheet = getOrCreateSheet(doc, "Products");
  const data = getData(sheet);
  return data.map(row => ({
    ...row,
    prices: safeJsonParse(row.prices, {}),
    additionalImages: safeJsonParse(row.additionalImages, []),
    isPopular: String(row.isPopular).toLowerCase() === "true",
    isRecommended: String(row.isRecommended).toLowerCase() === "true"
  }));
}

function safeJsonParse(jsonString, defaultValue) {
  if (!jsonString || typeof jsonString !== 'string') return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

function saveProduct(doc, product) {
  const sheet = getOrCreateSheet(doc, "Products");
  const headers = ["id", "name", "category", "productType", "prices", "description", "image", "additionalImages", "video", "isPopular", "isRecommended"];
  ensureHeaders(sheet, headers);
  if (isBase64(product.image)) product.image = uploadImageToDrive(product.image, "PROD_" + product.id);
  if (product.additionalImages) product.additionalImages = product.additionalImages.map((img, idx) => isBase64(img) ? uploadImageToDrive(img, `PROD_EXT_${product.id}_${idx}`) : img);
  const rowData = [product.id, product.name, product.category, product.productType || 'drink', JSON.stringify(product.prices), product.description, product.image, JSON.stringify(product.additionalImages || []), product.video || "", product.isPopular, product.isRecommended];
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][0]) === String(product.id)) { rowIndex = i + 1; break; } }
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  else sheet.appendRow(rowData);
  return { status: "success" };
}

function deleteProduct(doc, id) {
  const sheet = getOrCreateSheet(doc, "Products");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][0]) === String(id)) { sheet.deleteRow(i + 1); break; } }
  return { status: "success" };
}

function getOrders(doc) {
  if (!doc) doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(doc, "Orders");
  const data = getData(sheet);
  return data.map(row => ({ ...row, items: safeJsonParse(row.items, []), timestamp: Number(row.timestamp) }));
}

function createOrder(doc, order, slipImage) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const headers = ["id", "customerName", "userType", "items", "totalAmount", "paymentMethod", "deliveryLocation", "status", "slipUrl", "timestamp", "paymentStatus"];
  ensureHeaders(sheet, headers);
  let slipUrl = "";
  if (isBase64(slipImage)) slipUrl = uploadImageToDrive(slipImage, "SLIP_" + order.id);
  sheet.appendRow([order.id, order.customerName, order.userType, JSON.stringify(order.items), order.totalAmount, order.paymentMethod, order.deliveryLocation, order.status, slipUrl, order.timestamp, order.paymentStatus]);
  sendChatNotification(`🛍️ *New Order* (${order.id})\nCustomer: ${order.customerName}\nTotal: ${order.totalAmount}`);
  return { status: "success", slipUrl: slipUrl };
}

function updateOrderStatus(doc, id, status) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf("id");
  const statusIdx = rows[0].indexOf("status");
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][idIdx]) === String(id)) { sheet.getRange(i + 1, statusIdx + 1).setValue(status); break; } }
  return { status: "success" };
}

function updatePaymentStatus(doc, id, status) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf("id");
  let statusIdx = rows[0].indexOf("paymentStatus");
  if (statusIdx === -1) { sheet.getRange(1, sheet.getLastColumn() + 1).setValue("paymentStatus"); statusIdx = sheet.getLastColumn() - 1; }
  for (let i = 1; i < rows.length; i++) { if (String(rows[i][idIdx]) === String(id)) { sheet.getRange(i + 1, statusIdx + 1).setValue(status); break; } }
  return { status: "success" };
}

function updateOrderPayment(doc, id, slipImage) {
  const sheet = getOrCreateSheet(doc, "Orders");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIdx = headers.indexOf("id");
  const slipUrlIdx = headers.indexOf("slipUrl");
  const paymentMethodIdx = headers.indexOf("paymentMethod");
  const paymentStatusIdx = headers.indexOf("paymentStatus");

  let slipUrl = "";
  if (isBase64(slipImage)) {
    slipUrl = uploadImageToDrive(slipImage, "SLIP_UPDATE_" + id);
  } else {
    return { status: "error", message: "Invalid slip image data" };
  }

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(id)) {
      if (slipUrlIdx > -1) sheet.getRange(i + 1, slipUrlIdx + 1).setValue(slipUrl);
      if (paymentMethodIdx > -1) sheet.getRange(i + 1, paymentMethodIdx + 1).setValue("โอนชำระ");
      if (paymentStatusIdx > -1) sheet.getRange(i + 1, paymentStatusIdx + 1).setValue("รอชำระ");
      sendChatNotification(`💳 *Payment Updated* for Order (${id})\nA new slip has been uploaded.`);
      return { status: "success", slipUrl: slipUrl };
    }
  }
  return { status: "error", message: "Order not found" };
}

function isBase64(str) { return str && typeof str === 'string' && str.length > 200 && str.includes('base64'); }

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

function ensureHeaders(sheet, headers) { if (sheet.getLastRow() === 0) sheet.appendRow(headers); }

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
