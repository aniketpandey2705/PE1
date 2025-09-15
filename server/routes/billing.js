/**
 * Billing Routes
 * Handles billing and usage tracking
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getBillingDetails, getBillingHistory, getCurrentUsage } = require('../services/billingService');

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  console.log('🧪 Billing test endpoint hit');
  res.json({ message: 'Billing route is working!', timestamp: new Date().toISOString() });
});

// Get billing details
router.get('/details', authenticateToken, async (req, res) => {
  try {
    console.log(`💰 Getting billing details for user: ${req.user.id}`);
    const billingDetails = await getBillingDetails(req.user.id);
    console.log(`✅ Billing details retrieved successfully`);
    res.json(billingDetails);
  } catch (error) {
    console.error('❌ Get billing details error:', error);
    res.status(500).json({ error: 'Failed to get billing details' });
  }
});

// Get billing history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await getBillingHistory(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// Get current usage
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Getting current usage for user: ${req.user.id}`);
    const usage = await getCurrentUsage(req.user.id);
    console.log(`✅ Current usage retrieved successfully`);
    res.json(usage);
  } catch (error) {
    console.error('❌ Get current usage error:', error);
    res.status(500).json({ error: 'Failed to get current usage' });
  }
});

module.exports = router;