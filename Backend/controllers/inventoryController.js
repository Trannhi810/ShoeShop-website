const {
  getOverview,
  getItems,
  getLogs,
  adjustInventoryStock
} = require('../services/inventoryService');
const { handleServiceError } = require('../utils/serviceErrorHandler');

const getInventoryOverview = async (req, res) => {
  try {
    const data = await getOverview();
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const getInventoryItems = async (req, res) => {
  try {
    const data = await getItems(req.query);
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const data = await getLogs(req.query);
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

const adjustInventory = async (req, res) => {
  try {
    const data = await adjustInventoryStock(req.body, req.user?.id || null);
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

module.exports = {
  getInventoryOverview,
  getInventoryItems,
  getInventoryLogs,
  adjustInventory
};
