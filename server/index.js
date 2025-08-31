'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, CreateBucketCommand, HeadBucketCommand, PutPublicAccessBlockCommand, PutBucketEncryptionCommand, PutBucketOwnershipControlsCommand, ListBucketsCommand, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID, randomBytes } = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const NODE_ENV = process.env.NODE_ENV || 'development';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const JWT_SECRET = process.env.JWT_SECRET;
const DEV_MODE = process.env.DEV_MODE === 'true';
const SHOW_STORAGE_CLASS_OPTIONS = process.env.SHOW_STORAGE_CLASS_OPTIONS === 'true';
const SHOW_STORAGE_RECOMMENDATIONS = process.env.SHOW_STORAGE_RECOMMENDATIONS === 'true';
const DEFAULT_STORAGE_CLASS = process.env.DEFAULT_STORAGE_CLASS || 'STANDARD';

// Fail-fast on critical env
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Define it in your environment.');
  process.exit(1);
}
if (!DEV_MODE && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
  console.error('FATAL: AWS credentials are not set. Define AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or set DEV_MODE=true.');
  process.exit(1);
}

if (DEV_MODE) {
  console.log('🚧 DEV_MODE enabled - AWS S3 operations will be bypassed');
}

// Security: Helmet
app.use(helmet());

// Security: CORS with allowlist
const parsedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const devFallbackOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedOrigins = parsedOrigins.length
  ? parsedOrigins
  : (NODE_ENV !== 'production' ? devFallbackOrigins : []);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security: Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// AWS Configuration (skip if DEV_MODE)
const s3Client = DEV_MODE ? null : new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION
});

// Test AWS connection on startup (skip if DEV_MODE)
if (!DEV_MODE && s3Client) {
  console.log(`Testing AWS connection with region: ${AWS_REGION}`);
  console.log(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);
  
  // Simple test - list buckets
  (async () => {
    try {
      const command = new ListBucketsCommand({});
      const data = await s3Client.send(command);
      console.log('✅ AWS Connection Test Successful');
      console.log(`Found ${data.Buckets.length} existing buckets`);
    } catch (err) {
      console.error('❌ AWS Connection Test Failed:', err.name, err.message);
    }
  })();
}

// Data storage files
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const BILLING_FILE = path.join(DATA_DIR, 'billing.json');

// Site margin configuration (markup percentage)
const SITE_MARGIN = parseFloat(process.env.SITE_MARGIN || '30'); // 30% markup by default

// Initialize data storage
const initializeStorage = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Initialize users file if it doesn't exist
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
    }

    // Initialize files file if it doesn't exist
    try {
      await fs.access(FILES_FILE);
    } catch {
      await fs.writeFile(FILES_FILE, JSON.stringify([], null, 2));
    }

    // Initialize billing file if it doesn't exist
    try {
      await fs.access(BILLING_FILE);
    } catch {
      await fs.writeFile(BILLING_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Data access functions
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const readFiles = async () => {
  try {
    const data = await fs.readFile(FILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeFiles = async (files) => {
  await fs.writeFile(FILES_FILE, JSON.stringify(files, null, 2));
};

// Billing data access functions
const readBilling = async () => {
  try {
    const data = await fs.readFile(BILLING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeBilling = async (billing) => {
  await fs.writeFile(BILLING_FILE, JSON.stringify(billing, null, 2));
};

// Initialize storage on startup
initializeStorage();

// Helper: ID generator (prefers crypto.randomUUID)
const genId = () =>
  (typeof randomUUID === 'function' ? randomUUID() : randomBytes(16).toString('hex'));

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// S3 Storage Class Helper Functions
const getStorageClassRecommendation = (fileType, fileSize, fileName = '') => {
  const sizeInMB = fileSize / (1024 * 1024);
  const fileExtension = fileName.toLowerCase().split('.').pop() || '';
  
  // Get environment configuration
  const largeFileThreshold = parseInt(process.env.RECOMMEND_STANDARD_IA_THRESHOLD_MB || '100', 10);
  const glacierExtensions = (process.env.RECOMMEND_GLACIER_EXTENSIONS || '.zip,.rar,.tar,.gz,.7z,.bz2').split(',');
  const glacierIRExtensions = (process.env.RECOMMEND_GLACIER_IR_EXTENSIONS || '.bak,.backup,.sql,.dump').split(',');
  const standardExtensions = (process.env.RECOMMEND_STANDARD_EXTENSIONS || '.jpg,.jpeg,.png,.gif,.mp4,.avi,.pdf,.doc,.docx').split(',');
  
  // Large files (>threshold MB) - recommend Standard-IA for cost optimization
  if (sizeInMB > largeFileThreshold) {
    return {
      recommended: 'STANDARD_IA',
      reason: `Large file (${Math.round(sizeInMB)}MB) - Save 46% with Standard-IA`,
      savings: '46% cost savings compared to Standard'
    };
  }
  
  // Archive files - recommend Glacier for long-term storage
  if (glacierExtensions.some(ext => fileExtension === ext.replace('.', '') || fileType.includes(ext.replace('.', '')))) {
    return {
      recommended: 'GLACIER',
      reason: 'Archive file - Ideal for long-term storage',
      savings: '84% cost savings compared to Standard'
    };
  }
  
  // Backup files - recommend Glacier Instant Retrieval
  if (glacierIRExtensions.some(ext => fileExtension === ext.replace('.', '') || fileName.toLowerCase().includes(ext.replace('.', '')))) {
    return {
      recommended: 'GLACIER_IR',
      reason: 'Backup file - Instant retrieval with low cost',
      savings: '83% cost savings compared to Standard'
    };
  }
  
  // Frequently accessed files - recommend Standard
  if (standardExtensions.some(ext => fileExtension === ext.replace('.', '')) ||
      fileType.startsWith('image/') || fileType.startsWith('video/') || fileType === 'application/pdf') {
    return {
      recommended: 'STANDARD',
      reason: 'Frequently accessed file - Best performance',
      savings: 'Optimized for frequent access'
    };
  }
  
  // Default to Standard for other files
  return {
    recommended: 'STANDARD',
    reason: 'General purpose file',
    savings: 'Standard performance and availability'
  };
};

// Legacy function for backward compatibility
const getOptimalStorageClass = (fileType, fileSize, fileName = '') => {
  const recommendation = getStorageClassRecommendation(fileType, fileSize, fileName);
  return recommendation.recommended;
};

const getStorageClassCost = (storageClass, withMargin = true) => {
  // Base AWS costs per GB/month (as of 2024)
  const baseCosts = {
    'STANDARD': 0.023,
    'STANDARD_IA': 0.0125,
    'ONEZONE_IA': 0.01,
    'GLACIER_IR': 0.004,
    'GLACIER': 0.0036,
    'DEEP_ARCHIVE': 0.00099
  };
  
  const baseCost = baseCosts[storageClass] || baseCosts['STANDARD'];
  
  if (withMargin) {
    // Apply site margin markup
    return baseCost * (1 + SITE_MARGIN / 100);
  }
  
  return baseCost;
};

// Pricing structure with site margin
const getPricingStructure = () => {
  return {
    storage: {
      standard: {
        name: 'Standard Storage',
        baseCost: 0.023,
        price: getStorageClassCost('STANDARD'),
        description: 'Frequently accessed data'
      },
      ia: {
        name: 'Infrequent Access (IA)',
        baseCost: 0.0125,
        price: getStorageClassCost('STANDARD_IA'),
        description: 'Less frequently accessed data'
      },
      archive_instant: {
        name: 'Archive Instant Retrieval',
        baseCost: 0.004,
        price: getStorageClassCost('GLACIER_IR'),
        description: 'Rarely accessed, instant retrieval'
      },
      flexible_archive: {
        name: 'Flexible Archive',
        baseCost: 0.0036,
        price: getStorageClassCost('GLACIER'),
        description: 'Minutes to hours retrieval'
      },
      deep_archive: {
        name: 'Deep Archive',
        baseCost: 0.00099,
        price: getStorageClassCost('DEEP_ARCHIVE'),
        description: 'Up to 12 hours retrieval'
      }
    },
    requests: {
      uploads: {
        name: 'Uploads & Data Management',
        baseCost: 0.05,
        price: 0.05 * (1 + SITE_MARGIN / 100),
        unit: '1,000 requests'
      },
      downloads: {
        name: 'Downloads & Data Retrieval',
        baseCost: 0.004,
        price: 0.004 * (1 + SITE_MARGIN / 100),
        unit: '1,000 requests'
      }
    },
    transfer: {
      out: {
        name: 'Data Transfer Out',
        baseCost: 0.10,
        price: 0.10 * (1 + SITE_MARGIN / 100),
        freeAllowance: 10,
        description: 'First 10 GB free monthly'
      }
    },
    retrieval: {
      flexible_archive: {
        name: 'Flexible Archive Retrieval',
        baseCost: 0.04,
        price: 0.04 * (1 + SITE_MARGIN / 100)
      },
      deep_archive: {
        name: 'Deep Archive Retrieval',
        baseCost: 0.03,
        price: 0.03 * (1 + SITE_MARGIN / 100)
      }
    },
    margin: SITE_MARGIN
  };
};

// Track billing activity
const trackBillingActivity = async (userId, activityType, details) => {
  try {
    const billing = await readBilling();
    const activity = {
      id: genId(),
      userId: userId,
      type: activityType, // 'storage', 'request_upload', 'request_download', 'transfer_out', 'retrieval'
      timestamp: new Date().toISOString(),
      details: details,
      cost: details.cost || 0
    };
    
    billing.push(activity);
    await writeBilling(billing);
    
    return activity;
  } catch (error) {
    console.error('Error tracking billing activity:', error);
  }
};

// Multer configuration: memory storage with limits and MIME filter
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES || `${25 * 1024 * 1024}`, 10); // 25MB default
const allowedExact = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed'
]);
function isAllowedMime(mime) {
  return mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || allowedExact.has(mime);
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (isAllowedMime(file.mimetype)) return cb(null, true);
    return cb(new Error('Unsupported file type'));
  }
});

// Routes

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const users = await readUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique bucket name (lowercase) - in DEV_MODE this is just a placeholder
    const bucketName = DEV_MODE
      ? `dev-bucket-${genId()}`
      : `skycrate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create S3 bucket (skip in DEV_MODE)
    if (!DEV_MODE) {
      try {
        console.log(`Attempting to create bucket: ${bucketName} in region: ${AWS_REGION}`);
        
        const createParams = { Bucket: bucketName };
        if (AWS_REGION !== 'us-east-1') {
          createParams.CreateBucketConfiguration = { LocationConstraint: AWS_REGION };
          console.log(`Adding LocationConstraint: ${AWS_REGION}`);
        }

        console.log('Step 1: Creating bucket...');
        const createCommand = new CreateBucketCommand(createParams);
        await s3Client.send(createCommand);
        console.log('✅ Bucket created successfully');

        console.log('Step 2: Setting public access block...');
        const publicAccessCommand = new PutPublicAccessBlockCommand({
          Bucket: bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true
          }
        });
        await s3Client.send(publicAccessCommand);
        console.log('✅ Public access block set');

        console.log('Step 3: Setting bucket encryption...');
        const encryptionCommand = new PutBucketEncryptionCommand({
          Bucket: bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' }
              }
            ]
          }
        });
        await s3Client.send(encryptionCommand);
        console.log('✅ Bucket encryption set');

        console.log('Step 4: Setting ownership controls...');
        const ownershipCommand = new PutBucketOwnershipControlsCommand({
          Bucket: bucketName,
          OwnershipControls: {
            Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }]
          }
        });
        await s3Client.send(ownershipCommand);
        console.log('✅ Ownership controls set');

        console.log(`🎉 S3 bucket fully configured: ${bucketName}`);
      } catch (error) {
        console.error('❌ Error creating S3 bucket:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Status Code:', error.statusCode);
        console.error('Region:', error.region);
        console.error('Full Error:', error);
        return res.status(500).json({
          error: 'Failed to create storage bucket',
          details: `${error.code}: ${error.message}`
        });
      }
    } else {
      console.log(`DEV_MODE: Skipping S3 bucket creation for user ${email}`);
    }

    // Create user
    const newUser = {
      id: genId(),
      email,
      password: hashedPassword,
      username,
      awsBucketName: bucketName,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        bucketName: newUser.awsBucketName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const users = await readUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bucketName: user.awsBucketName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Delete Account and S3 Bucket
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const bucketName = req.user.awsBucketName;
    console.log(`⚠️  Deleting account for user: ${userId} (bucket: ${bucketName})`);

    // 1. Delete all user files from files.json
    const files = await readFiles();
    const updatedFiles = files.filter(f => f.userId !== userId);
    await writeFiles(updatedFiles);
    console.log(`🗑️  Deleted all files for user: ${userId}`);

    // 2. Remove user from users.json
    const users = await readUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    await writeUsers(updatedUsers);
    console.log(`🗑️  Deleted user from users.json: ${userId}`);

    // 3. Delete S3 bucket (skip in DEV_MODE)
    if (!DEV_MODE) {
      try {
        // List and delete all objects in the bucket
        const { ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } = require('@aws-sdk/client-s3');
        // List all objects
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const listedObjects = await s3Client.send(listCommand);
        if (listedObjects.Contents && listedObjects.Contents.length > 0) {
          const deleteParams = {
            Bucket: bucketName,
            Delete: { Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key })) }
          };
          const deleteCommand = new DeleteObjectsCommand(deleteParams);
          await s3Client.send(deleteCommand);
          console.log(`🗑️  Deleted all objects in bucket: ${bucketName}`);
        }
        // Delete the bucket
        const deleteBucketCommand = new DeleteBucketCommand({ Bucket: bucketName });
        await s3Client.send(deleteBucketCommand);
        console.log(`🪣 Deleted S3 bucket: ${bucketName}`);
      } catch (err) {
        console.error('Error deleting S3 bucket:', err);
        // Continue even if S3 deletion fails
      }
    } else {
      console.log(`DEV_MODE: Skipping S3 bucket deletion for user ${userId}`);
    }

    res.json({ message: 'Account and bucket deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// Get Storage Class Recommendations
app.post('/api/storage/recommendations', authenticateToken, (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'fileName, fileType, and fileSize are required' });
    }

    // Get recommendation
    const recommendation = getStorageClassRecommendation(fileType, fileSize, fileName);
    
    // Get all available storage classes with costs
    const storageClasses = [
      {
        name: 'STANDARD',
        displayName: 'Standard',
        cost: 0.023,
        description: 'Frequently accessed files, immediate retrieval',
        retrievalTime: 'Immediate',
        minimumDuration: 'None'
      },
      {
        name: 'STANDARD_IA',
        displayName: 'Standard-IA',
        cost: 0.0125,
        description: 'Infrequently accessed, immediate retrieval',
        retrievalTime: 'Immediate',
        minimumDuration: '30 days'
      },
      {
        name: 'ONEZONE_IA',
        displayName: 'One Zone-IA',
        cost: 0.01,
        description: 'Non-critical, infrequent access, immediate retrieval',
        retrievalTime: 'Immediate',
        minimumDuration: '30 days'
      },
      {
        name: 'GLACIER_IR',
        displayName: 'Glacier Instant Retrieval',
        cost: 0.004,
        description: 'Archive with instant retrieval',
        retrievalTime: 'Immediate',
        minimumDuration: '90 days'
      },
      {
        name: 'GLACIER',
        displayName: 'Glacier',
        cost: 0.0036,
        description: 'Long-term archive',
        retrievalTime: '1-5 minutes',
        minimumDuration: '90 days'
      },
      {
        name: 'DEEP_ARCHIVE',
        displayName: 'Deep Archive',
        cost: 0.00099,
        description: 'Long-term backup',
        retrievalTime: '12 hours',
        minimumDuration: '180 days'
      }
    ];

    // Calculate estimated monthly costs for each storage class
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);
    const storageClassesWithCosts = storageClasses.map(sc => ({
      ...sc,
      estimatedMonthlyCost: sc.cost * fileSizeGB,
      savingsVsStandard: Math.round(((0.023 - sc.cost) / 0.023) * 100)
    }));

    res.json({
      recommendation,
      storageClasses: storageClassesWithCosts,
      showOptions: SHOW_STORAGE_CLASS_OPTIONS,
      showRecommendations: SHOW_STORAGE_RECOMMENDATIONS,
      defaultStorageClass: DEFAULT_STORAGE_CLASS
    });

  } catch (error) {
    console.error('Storage recommendations error:', error);
    res.status(500).json({ error: 'Failed to get storage recommendations' });
  }
});

// Upload File with Storage Class Selection
app.post('/api/files/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const { parentFolderId = null, storageClass } = req.body;
    const fileName = `${Date.now()}-${originalname}`;
    
    // Build S3 key with folder path
    const folderPath = await buildFolderPath(parentFolderId, req.user.id);
    const s3Key = `uploads/${folderPath}${fileName}`;
    
    // Determine storage class to use
    let selectedStorageClass;
    if (storageClass && ['STANDARD', 'STANDARD_IA', 'ONEZONE_IA', 'GLACIER_IR', 'GLACIER', 'DEEP_ARCHIVE'].includes(storageClass)) {
      selectedStorageClass = storageClass;
    } else if (SHOW_STORAGE_CLASS_OPTIONS) {
      // If storage class options are enabled but none provided, use default
      selectedStorageClass = DEFAULT_STORAGE_CLASS;
    } else {
      // Use automatic optimization (legacy behavior)
      selectedStorageClass = getOptimalStorageClass(mimetype, size, originalname);
    }
    
    const estimatedMonthlyCost = getStorageClassCost(selectedStorageClass) * (size / (1024 * 1024 * 1024)); // Cost per GB
    
    // Track upload request billing
    await trackBillingActivity(req.user.id, 'request_upload', {
      fileName: originalname,
      fileSize: size,
      storageClass: selectedStorageClass,
      cost: getPricingStructure().requests.uploads.price / 1000 // Cost per single request
    });
    
    let signedUrl = '';

    if (!DEV_MODE) {
      // Check if user's bucket still exists (once)
      try {
        const headCommand = new HeadBucketCommand({ Bucket: req.user.awsBucketName });
        await s3Client.send(headCommand);
      } catch (bucketError) {
        if (bucketError.name === 'NoSuchBucket' || bucketError.name === 'NotFound') {
          console.log(`User ${req.user.id} bucket not found, cleaning up user data`);

          // Remove user from users.json
          const users = await readUsers();
          const updatedUsers = users.filter(u => u.id !== req.user.id);
          await writeUsers(updatedUsers);

          // Remove user's files from files.json
          const files = await readFiles();
          const updatedFiles = files.filter(f => f.userId !== req.user.id);
          await writeFiles(updatedFiles);

          return res.status(404).json({ error: 'Your storage bucket was deleted. Please register again.' });
        }
        throw bucketError;
      }

      // Upload to S3 with selected storage class
      const uploadParams = {
        Bucket: req.user.awsBucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimetype,
        StorageClass: selectedStorageClass,
        ServerSideEncryption: 'AES256'
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);

      console.log(`✅ File uploaded with storage class: ${selectedStorageClass}`);
      console.log(`💰 Estimated monthly cost: ${estimatedMonthlyCost.toFixed(4)}`);

      // Generate pre-signed URL for download
      const getObjectCommand = new GetObjectCommand({
        Bucket: req.user.awsBucketName,
        Key: s3Key
      });
      signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
      
      // Track storage billing
      await trackBillingActivity(req.user.id, 'storage', {
        fileName: fileName,
        fileSize: size,
        storageClass: selectedStorageClass,
        cost: estimatedMonthlyCost
      });
    } else {
      // DEV_MODE: Generate a fake URL for testing
      signedUrl = `http://localhost:${PORT}/dev/file/${fileName}`;
      console.log(`DEV_MODE: Simulating file upload for ${originalname} with storage class: ${selectedStorageClass}`);
    }

    // Save file info to storage
    console.log('Saving file metadata to JSON...');
    const files = await readFiles();
    console.log(`Current files in storage: ${files.length}`);
    
    const newFile = {
      id: genId(),
      userId: req.user.id,
      fileName: fileName,
      originalName: originalname,
      fileSize: size,
      fileType: mimetype,
      s3Key: s3Key,
      bucketName: req.user.awsBucketName,
      storageClass: selectedStorageClass,
      estimatedMonthlyCost: estimatedMonthlyCost,
      uploadDate: new Date().toISOString(),
      isStarred: false,
      isFolder: false,
      parentFolderId: parentFolderId
    };

    console.log('New file object:', newFile);
    files.push(newFile);
    console.log(`Files array length after push: ${files.length}`);
    
    try {
      await writeFiles(files);
      console.log('✅ File metadata saved successfully');
    } catch (writeError) {
      console.error('❌ Failed to save file metadata:', writeError);
      throw writeError;
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        originalName: newFile.originalName,
        fileSize: newFile.fileSize,
        fileType: newFile.fileType,
        storageClass: newFile.storageClass,
        estimatedMonthlyCost: newFile.estimatedMonthlyCost,
        uploadDate: newFile.uploadDate,
        url: signedUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get User Files
app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    const { folderId = null } = req.query;
    const files = await readFiles();
    const userFiles = files.filter(f =>
      f.userId === req.user.id &&
      f.parentFolderId === folderId
    );

    if (!DEV_MODE) {
      // Check bucket once per request
      try {
        const headCommand = new HeadBucketCommand({ Bucket: req.user.awsBucketName });
        await s3Client.send(headCommand);
      } catch (bucketError) {
        if (bucketError.name === 'NoSuchBucket' || bucketError.name === 'NotFound') {
          console.log(`User ${req.user.id} bucket not found, cleaning up user data`);

          // Remove user from users.json
          const users = await readUsers();
          const updatedUsers = users.filter(u => u.id !== req.user.id);
          await writeUsers(updatedUsers);

          // Remove user's files from files.json
          const updatedFiles = files.filter(f => f.userId !== req.user.id);
          await writeFiles(updatedFiles);

          return res.status(404).json({ error: 'User bucket not found. Please register again.' });
        }
        throw bucketError;
      }

      const filesWithUrls = await Promise.all(userFiles.map(async (file) => {
        if (file.isFolder) {
          return {
            id: file.id,
            folderName: file.folderName,
            isFolder: file.isFolder,
            parentFolderId: file.parentFolderId,
            createdAt: file.createdAt,
            isStarred: file.isStarred
          };
        } else {
          const getObjectCommand = new GetObjectCommand({
            Bucket: file.bucketName,
            Key: file.s3Key
          });
          const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
          
          // Track download request billing
          await trackBillingActivity(req.user.id, 'request_download', {
            fileName: file.fileName,
            fileSize: file.fileSize,
            cost: getPricingStructure().requests.downloads.price / 1000 // Cost per single request
          });

          return {
            id: file.id,
            fileName: file.fileName,
            originalName: file.originalName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            storageClass: file.storageClass || 'STANDARD',
            estimatedMonthlyCost: file.estimatedMonthlyCost || 0,
            uploadDate: file.uploadDate,
            isStarred: file.isStarred,
            isFolder: file.isFolder,
            parentFolderId: file.parentFolderId,
            url: signedUrl
          };
        }
      }));

      res.json(filesWithUrls);
    } else {
      // DEV_MODE: Return files with fake URLs
      const filesWithUrls = userFiles.map((file) => {
        if (file.isFolder) {
          return {
            id: file.id,
            folderName: file.folderName,
            isFolder: file.isFolder,
            parentFolderId: file.parentFolderId,
            createdAt: file.createdAt,
            isStarred: file.isStarred
          };
        } else {
          return {
            id: file.id,
            fileName: file.fileName,
            originalName: file.originalName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            storageClass: file.storageClass || 'STANDARD',
            estimatedMonthlyCost: file.estimatedMonthlyCost || 0,
            uploadDate: file.uploadDate,
            isStarred: file.isStarred,
            isFolder: file.isFolder,
            parentFolderId: file.parentFolderId,
            url: `http://localhost:${PORT}/dev/file/${file.fileName}`
          };
        }
      });

      res.json(filesWithUrls);
    }
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get Storage Cost Analysis
app.get('/api/storage/cost-analysis', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);

    const analysis = {
      totalFiles: userFiles.length,
      totalSize: userFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      totalMonthlyCost: userFiles.reduce((sum, file) => sum + (file.estimatedMonthlyCost || 0), 0),
      storageClassBreakdown: {},
      recommendations: []
    };

    // Group by storage class
    userFiles.forEach(file => {
      const storageClass = file.storageClass || 'STANDARD';
      if (!analysis.storageClassBreakdown[storageClass]) {
        analysis.storageClassBreakdown[storageClass] = {
          count: 0,
          totalSize: 0,
          totalCost: 0
        };
      }
      analysis.storageClassBreakdown[storageClass].count++;
      analysis.storageClassBreakdown[storageClass].totalSize += file.fileSize || 0;
      analysis.storageClassBreakdown[storageClass].totalCost += file.estimatedMonthlyCost || 0;
    });

    // Generate recommendations
    if (analysis.totalMonthlyCost > 10) {
      analysis.recommendations.push('Consider moving large, infrequently accessed files to Glacier storage class');
    }
    if (analysis.storageClassBreakdown['STANDARD']?.totalSize > 1024 * 1024 * 1024) { // 1GB
      analysis.recommendations.push('Large files in Standard storage could be moved to Standard-IA for cost savings');
    }

    res.json(analysis);
  } catch (error) {
    console.error('Cost analysis error:', error);
    res.status(500).json({ error: 'Failed to generate cost analysis' });
  }
});

// Get Storage Statistics
app.get('/api/billing/details', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);

    // For now, we'll assume a user is on a free plan.
    // In a real application, you would fetch this from your user database.
    const plan = { name: 'Free', price: 0 }; 

    const usage = {
      totalSize: userFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      totalFiles: userFiles.length,
    };

    const estimatedCost = userFiles.reduce((sum, file) => sum + (file.estimatedMonthlyCost || 0), 0);

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    res.json({
      plan,
      usage,
      estimatedCost,
      nextBillingDate: nextBillingDate.toISOString(),
    });

  } catch (error) {
    console.error('Get billing details error:', error);
    res.status(500).json({ error: 'Failed to fetch billing details' });
  }
});

app.get('/api/storage/stats', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);

    const stats = {
      totalFiles: userFiles.length,
      totalSize: userFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      totalMonthlyCost: userFiles.reduce((sum, file) => sum + (file.estimatedMonthlyCost || 0), 0),
      storageClassBreakdown: {},
      fileTypeBreakdown: {},
      sizeBreakdown: {
        small: 0,    // < 1MB
        medium: 0,   // 1MB - 100MB
        large: 0,    // 100MB - 1GB
        huge: 0      // > 1GB
      }
    };

    // Group by storage class and file type
    userFiles.forEach(file => {
      const storageClass = file.storageClass || 'STANDARD';
      const fileType = file.fileType || 'unknown';
      const fileSize = file.fileSize || 0;

      // Storage class breakdown
      if (!stats.storageClassBreakdown[storageClass]) {
        stats.storageClassBreakdown[storageClass] = {
          count: 0,
          totalSize: 0,
          totalCost: 0
        };
      }
      stats.storageClassBreakdown[storageClass].count++;
      stats.storageClassBreakdown[storageClass].totalSize += fileSize;
      stats.storageClassBreakdown[storageClass].totalCost += file.estimatedMonthlyCost || 0;

      // File type breakdown
      if (!stats.fileTypeBreakdown[fileType]) {
        stats.fileTypeBreakdown[fileType] = {
          count: 0,
          totalSize: 0
        };
      }
      stats.fileTypeBreakdown[fileType].count++;
      stats.fileTypeBreakdown[fileType].totalSize += fileSize;

      // Size breakdown
      if (fileSize < 1024 * 1024) { // < 1MB
        stats.sizeBreakdown.small++;
      } else if (fileSize < 100 * 1024 * 1024) { // 1MB - 100MB
        stats.sizeBreakdown.medium++;
      } else if (fileSize < 1024 * 1024 * 1024) { // 100MB - 1GB
        stats.sizeBreakdown.large++;
      } else { // > 1GB
        stats.sizeBreakdown.huge++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Storage stats error:', error);
    res.status(500).json({ error: 'Failed to generate storage statistics' });
  }
});

// Delete File
app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    console.log(`Delete request for file ID: ${req.params.fileId} by user: ${req.user.id}`);
    
    const files = await readFiles();
    console.log(`Total files in storage: ${files.length}`);
    console.log(`User's files: ${files.filter(f => f.userId === req.user.id).length}`);
    
    const file = files.find(f => f.id === req.params.fileId && f.userId === req.user.id);

    if (!file) {
      console.log(`File not found. Available file IDs for user:`, files.filter(f => f.userId === req.user.id).map(f => f.id));
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`Found file: ${file.originalName}`);

    // Delete from S3 (skip in DEV_MODE)
    if (!DEV_MODE) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: file.bucketName,
        Key: file.s3Key
      });
      await s3Client.send(deleteCommand);
    } else {
      console.log(`DEV_MODE: Simulating S3 delete for file ${file.fileName}`);
    }

    // Delete from storage
    const updatedFiles = files.filter(f => f.id !== req.params.fileId);
    await writeFiles(updatedFiles);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Helper function to build folder path
const buildFolderPath = async (folderId, userId) => {
  if (!folderId) return '';
  
  const files = await readFiles();
  const folders = files.filter(f => f.userId === userId && f.isFolder === true);
  
  const buildPath = (id, path = []) => {
    const folder = folders.find(f => f.id === id);
    if (!folder) return path;
    
    path.unshift(folder.folderName);
    if (folder.parentFolderId) {
      return buildPath(folder.parentFolderId, path);
    }
    return path;
  };
  
  const pathArray = buildPath(folderId);
  return pathArray.length > 0 ? pathArray.join('/') + '/' : '';
};

// Create Folder
app.post('/api/folders', authenticateToken, async (req, res) => {
  try {
    const { folderName, parentFolderId = null } = req.body;

    if (!folderName || folderName.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Validate folder name (no special characters that could break S3 paths)
    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9\-_\s]/g, '');
    if (sanitizedFolderName !== folderName.trim()) {
      return res.status(400).json({ error: 'Folder name contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.' });
    }

    // Check if folder with same name exists in the same parent directory
    const files = await readFiles();
    const existingFolder = files.find(f =>
      f.userId === req.user.id &&
      f.isFolder === true &&
      f.folderName === sanitizedFolderName &&
      f.parentFolderId === parentFolderId
    );

    if (existingFolder) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    // Build the S3 folder path
    const parentPath = await buildFolderPath(parentFolderId, req.user.id);
    const s3FolderPath = `${parentPath}${sanitizedFolderName}/`;

    // Create folder in S3 (skip in DEV_MODE)
    if (!DEV_MODE) {
      try {
        // Create a placeholder object to represent the folder in S3
        const folderMarkerKey = `folders/${s3FolderPath}.foldermarker`;
        const putObjectCommand = new PutObjectCommand({
          Bucket: req.user.awsBucketName,
          Key: folderMarkerKey,
          Body: '',
          ContentType: 'application/x-directory',
          ServerSideEncryption: 'AES256'
        });
        
        await s3Client.send(putObjectCommand);
        console.log(`✅ S3 folder created: ${s3FolderPath}`);
      } catch (s3Error) {
        console.error('❌ Error creating S3 folder:', s3Error);
        return res.status(500).json({ error: 'Failed to create folder in storage' });
      }
    } else {
      console.log(`DEV_MODE: Simulating S3 folder creation for ${s3FolderPath}`);
    }

    // Create folder entry in database
    const newFolder = {
      id: genId(),
      userId: req.user.id,
      folderName: sanitizedFolderName,
      isFolder: true,
      parentFolderId: parentFolderId,
      s3FolderPath: s3FolderPath,
      createdAt: new Date().toISOString(),
      isStarred: false
    };

    files.push(newFolder);
    await writeFiles(files);

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        id: newFolder.id,
        folderName: newFolder.folderName,
        isFolder: newFolder.isFolder,
        parentFolderId: newFolder.parentFolderId,
        s3FolderPath: newFolder.s3FolderPath,
        createdAt: newFolder.createdAt,
        isStarred: newFolder.isStarred
      }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get Folders
app.get('/api/folders', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const userFolders = files.filter(f => f.userId === req.user.id && f.isFolder === true);

    res.json(userFolders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Delete Folder
app.delete('/api/folders/:folderId', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const folder = files.find(f => f.id === req.params.folderId && f.userId === req.user.id && f.isFolder === true);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if folder has contents (files or subfolders)
    const folderContents = files.filter(f =>
      f.userId === req.user.id &&
      f.parentFolderId === req.params.folderId
    );

    if (folderContents.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with contents. Please empty the folder first.' });
    }

    // Delete folder marker from S3 (skip in DEV_MODE)
    if (!DEV_MODE && folder.s3FolderPath) {
      try {
        const folderMarkerKey = `folders/${folder.s3FolderPath}.foldermarker`;
        const deleteCommand = new DeleteObjectCommand({
          Bucket: req.user.awsBucketName,
          Key: folderMarkerKey
        });
        await s3Client.send(deleteCommand);
        console.log(`✅ S3 folder marker deleted: ${folder.s3FolderPath}`);
      } catch (s3Error) {
        console.error('❌ Error deleting S3 folder marker:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    } else {
      console.log(`DEV_MODE: Simulating S3 folder deletion for ${folder.s3FolderPath}`);
    }

    // Remove folder from storage
    const updatedFiles = files.filter(f => f.id !== req.params.folderId);
    await writeFiles(updatedFiles);

    res.json({ message: 'Folder deleted successfully' });

  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Bulk Delete Files/Folders
app.delete('/api/files/bulk', authenticateToken, async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array is required' });
    }

    console.log(`Bulk delete request for ${fileIds.length} items by user: ${req.user.id}`);
    
    const files = await readFiles();
    const userFiles = files.filter(f => f.userId === req.user.id);
    const itemsToDelete = userFiles.filter(f => fileIds.includes(f.id));
    
    if (itemsToDelete.length === 0) {
      return res.status(404).json({ error: 'No items found to delete' });
    }

    console.log(`Found ${itemsToDelete.length} items to delete`);

    const results = [];
    
    // Process each item
    for (const item of itemsToDelete) {
      try {
        if (item.isFolder) {
          // Check if folder has contents
          const folderContents = files.filter(f =>
            f.userId === req.user.id &&
            f.parentFolderId === item.id
          );

          if (folderContents.length > 0) {
            results.push({
              id: item.id,
              success: false,
              error: 'Cannot delete folder with contents'
            });
            continue;
          }

          // Delete folder marker from S3 (skip in DEV_MODE)
          if (!DEV_MODE && item.s3FolderPath) {
            try {
              const folderMarkerKey = `folders/${item.s3FolderPath}.foldermarker`;
              const deleteCommand = new DeleteObjectCommand({
                Bucket: req.user.awsBucketName,
                Key: folderMarkerKey
              });
              await s3Client.send(deleteCommand);
              console.log(`✅ S3 folder marker deleted: ${item.s3FolderPath}`);
            } catch (s3Error) {
              console.error('❌ Error deleting S3 folder marker:', s3Error);
              results.push({
                id: item.id,
                success: false,
                error: 'Failed to delete from storage'
              });
              continue;
            }
          }
        } else {
          // Delete file from S3 (skip in DEV_MODE)
          if (!DEV_MODE) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: item.bucketName,
              Key: item.s3Key
            });
            await s3Client.send(deleteCommand);
            console.log(`✅ S3 file deleted: ${item.s3Key}`);
          } else {
            console.log(`DEV_MODE: Simulating S3 delete for file ${item.fileName}`);
          }
        }

        results.push({
          id: item.id,
          success: true
        });

      } catch (error) {
        console.error(`Error deleting item ${item.id}:`, error);
        results.push({
          id: item.id,
          success: false,
          error: error.message
        });
      }
    }

    // Remove successfully deleted items from files.json
    const successfulIds = results.filter(r => r.success).map(r => r.id);
    const updatedFiles = files.filter(f => !successfulIds.includes(f.id));
    await writeFiles(updatedFiles);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Bulk delete completed: ${successCount} success, ${failureCount} failures`);

    res.json({
      message: `Bulk delete completed: ${successCount} items deleted, ${failureCount} failed`,
      results: results,
      successCount: successCount,
      failureCount: failureCount
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// Toggle Star File
app.patch('/api/files/:fileId/star', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const fileIndex = files.findIndex(f => f.id === req.params.fileId && f.userId === req.user.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Toggle using server state, not client-provided body
    files[fileIndex].isStarred = !files[fileIndex].isStarred;
    await writeFiles(files);

    res.json({
      message: 'File star status updated',
      isStarred: files[fileIndex].isStarred
    });

  } catch (error) {
    console.error('Star file error:', error);
    res.status(500).json({ error: 'Failed to update file star status' });
  }
});

// Generate presigned URL for file sharing
app.post('/api/files/:fileId/share', authenticateToken, async (req, res) => {
  try {
    const { expiryTime } = req.body;
    
    // Convert expiry time to seconds
    let expiresIn = 3600; // Default 1 hour
    switch(expiryTime) {
      case '24h': expiresIn = 86400; break;
      case '7d': expiresIn = 604800; break;
      case '30d': expiresIn = 2592000; break;
    }

    const files = await readFiles();
    const file = files.find(f => f.id === req.params.fileId && f.userId === req.user.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!DEV_MODE) {
      const command = new GetObjectCommand({
        Bucket: req.user.awsBucketName,
        Key: file.s3Key
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn });
      res.json({ url });
    } else {
      // DEV_MODE: Return a fake URL
      res.json({ 
        url: `http://localhost:${PORT}/dev/shared/${file.fileName}?expires=${Date.now() + (expiresIn * 1000)}` 
      });
    }
  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({ error: 'Failed to generate share URL' });
  }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user's bucket still exists (skip in DEV_MODE)
    if (!DEV_MODE) {
      try {
        const headCommand = new HeadBucketCommand({ Bucket: req.user.awsBucketName });
        await s3Client.send(headCommand);
      } catch (bucketError) {
        if (bucketError.name === 'NoSuchBucket' || bucketError.name === 'NotFound') {
          console.log(`User ${req.user.id} bucket not found, cleaning up user data`);

          // Remove user from users.json
          const users = await readUsers();
          const updatedUsers = users.filter(u => u.id !== req.user.id);
          await writeUsers(updatedUsers);

          // Remove user's files from files.json
          const files = await readFiles();
          const updatedFiles = files.filter(f => f.userId !== req.user.id);
          await writeFiles(updatedFiles);

          return res.status(404).json({ error: 'User bucket not found. Please register again.' });
        }
      }
    }

    const { password, ...userProfile } = req.user;
    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get Real Usage Data and Billing
app.get('/api/billing/usage', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const files = await readFiles();
    const billing = await readBilling();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);
    const userBilling = billing.filter(b => b.userId === req.user.id);
    
    // Calculate current storage usage
    const storageUsage = {};
    let totalStorageCost = 0;
    
    userFiles.forEach(file => {
      const storageClass = file.storageClass || 'STANDARD';
      if (!storageUsage[storageClass]) {
        storageUsage[storageClass] = { used: 0, cost: 0 };
      }
      const sizeInGB = (file.fileSize || 0) / (1024 * 1024 * 1024);
      const monthlyCost = getStorageClassCost(storageClass) * sizeInGB;
      storageUsage[storageClass].used += sizeInGB;
      storageUsage[storageClass].cost += monthlyCost;
      totalStorageCost += monthlyCost;
    });
    
    // Calculate request costs for the month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0);
    
    const monthlyBilling = userBilling.filter(b => {
      const activityDate = new Date(b.timestamp);
      return activityDate >= monthStart && activityDate <= monthEnd;
    });
    
    const requestCosts = {
      uploads: { count: 0, cost: 0 },
      downloads: { count: 0, cost: 0 }
    };
    
    const transferCosts = {
      out: { used: 0, freeUsed: 0, billableUsed: 0, cost: 0 }
    };
    
    const retrievalCosts = {
      flexible_archive: { used: 0, cost: 0 },
      deep_archive: { used: 0, cost: 0 }
    };
    
    monthlyBilling.forEach(activity => {
      switch(activity.type) {
        case 'request_upload':
          requestCosts.uploads.count++;
          requestCosts.uploads.cost += activity.cost;
          break;
        case 'request_download':
          requestCosts.downloads.count++;
          requestCosts.downloads.cost += activity.cost;
          break;
        case 'transfer_out':
          const transferGB = activity.details.sizeGB || 0;
          transferCosts.out.used += transferGB;
          if (transferCosts.out.used <= 10) {
            transferCosts.out.freeUsed += transferGB;
          } else {
            const billable = transferGB - Math.max(0, 10 - (transferCosts.out.used - transferGB));
            transferCosts.out.billableUsed += billable;
            transferCosts.out.cost += billable * getPricingStructure().transfer.out.price;
          }
          break;
        case 'retrieval':
          if (activity.details.storageClass === 'GLACIER') {
            const retrievalGB = activity.details.sizeGB || 0;
            retrievalCosts.flexible_archive.used += retrievalGB;
            retrievalCosts.flexible_archive.cost += retrievalGB * getPricingStructure().retrieval.flexible_archive.price;
          } else if (activity.details.storageClass === 'DEEP_ARCHIVE') {
            const retrievalGB = activity.details.sizeGB || 0;
            retrievalCosts.deep_archive.used += retrievalGB;
            retrievalCosts.deep_archive.cost += retrievalGB * getPricingStructure().retrieval.deep_archive.price;
          }
          break;
      }
    });
    
    const totalUsageCost = totalStorageCost +
                          requestCosts.uploads.cost +
                          requestCosts.downloads.cost +
                          transferCosts.out.cost +
                          retrievalCosts.flexible_archive.cost +
                          retrievalCosts.deep_archive.cost;
    
    // Calculate projected month-end cost based on current usage trend
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const currentDay = currentDate.getDate();
    const projectedCost = targetMonth === currentDate.getMonth() + 1 && targetYear === currentDate.getFullYear()
      ? (totalUsageCost / currentDay) * daysInMonth
      : totalUsageCost;
    
    res.json({
      month: targetMonth,
      year: targetYear,
      storage: {
        classes: storageUsage,
        totalUsed: userFiles.reduce((sum, f) => sum + (f.fileSize || 0) / (1024 * 1024 * 1024), 0),
        totalCost: totalStorageCost
      },
      requests: {
        uploads: requestCosts.uploads,
        downloads: requestCosts.downloads,
        totalCost: requestCosts.uploads.cost + requestCosts.downloads.cost
      },
      transfer: {
        out: transferCosts.out,
        totalCost: transferCosts.out.cost
      },
      retrieval: {
        flexible_archive: retrievalCosts.flexible_archive,
        deep_archive: retrievalCosts.deep_archive,
        totalCost: retrievalCosts.flexible_archive.cost + retrievalCosts.deep_archive.cost
      },
      totalCost: totalUsageCost,
      projectedMonthEnd: projectedCost,
      pricing: getPricingStructure()
    });
    
  } catch (error) {
    console.error('Get billing usage error:', error);
    res.status(500).json({ error: 'Failed to fetch billing usage' });
  }
});

// Get Billing History
app.get('/api/billing/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 12 } = req.query; // Default to 12 months
    
    const files = await readFiles();
    const billing = await readBilling();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);
    const userBilling = billing.filter(b => b.userId === req.user.id);
    
    // Generate monthly billing history
    const history = [];
    const currentDate = new Date();
    
    for (let i = 0; i < parseInt(limit); i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      const monthlyBilling = userBilling.filter(b => {
        const activityDate = new Date(b.timestamp);
        return activityDate >= monthStart && activityDate <= monthEnd;
      });
      
      // Calculate costs for this month
      const storageCost = userFiles.reduce((sum, file) => {
        const fileDate = new Date(file.uploadDate);
        if (fileDate <= monthEnd) {
          const sizeInGB = (file.fileSize || 0) / (1024 * 1024 * 1024);
          return sum + (getStorageClassCost(file.storageClass || 'STANDARD') * sizeInGB);
        }
        return sum;
      }, 0);
      
      const requestCost = monthlyBilling
        .filter(b => b.type.startsWith('request_'))
        .reduce((sum, b) => sum + b.cost, 0);
        
      const transferCost = monthlyBilling
        .filter(b => b.type === 'transfer_out')
        .reduce((sum, b) => sum + b.cost, 0);
        
      const retrievalCost = monthlyBilling
        .filter(b => b.type === 'retrieval')
        .reduce((sum, b) => sum + b.cost, 0);
      
      const totalCost = storageCost + requestCost + transferCost + retrievalCost;
      
      history.push({
        id: i + 1,
        date: monthStart.toISOString(),
        period: `${targetDate.toLocaleDateString('en-US', { month: 'long' })} ${year}`,
        breakdown: {
          storage: parseFloat(storageCost.toFixed(2)),
          requests: parseFloat(requestCost.toFixed(2)),
          transfer: parseFloat(transferCost.toFixed(2)),
          retrieval: parseFloat(retrievalCost.toFixed(2))
        },
        total: parseFloat(totalCost.toFixed(2)),
        status: i === 0 ? 'current' : 'paid',
        invoice: `INV-${year}-${String(month).padStart(2, '0')}`
      });
    }
    
    res.json(history);
    
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

// Get Current Month Costs
app.get('/api/billing/current', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const files = await readFiles();
    const billing = await readBilling();
    const userFiles = files.filter(f => f.userId === req.user.id && !f.isFolder);
    const userBilling = billing.filter(b => b.userId === req.user.id);
    
    // Calculate current storage usage
    let totalStorageCost = 0;
    userFiles.forEach(file => {
      const sizeInGB = (file.fileSize || 0) / (1024 * 1024 * 1024);
      const monthlyCost = getStorageClassCost(file.storageClass || 'STANDARD') * sizeInGB;
      totalStorageCost += monthlyCost;
    });
    
    // Calculate request costs for current month
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);
    
    const currentMonthBilling = userBilling.filter(b => {
      const activityDate = new Date(b.timestamp);
      return activityDate >= monthStart && activityDate <= monthEnd;
    });
    
    const currentMonthCost = totalStorageCost + currentMonthBilling.reduce((sum, b) => sum + b.cost, 0);
    
    // Calculate last month costs for comparison
    const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0);
    
    const lastMonthBilling = userBilling.filter(b => {
      const activityDate = new Date(b.timestamp);
      return activityDate >= lastMonthStart && activityDate <= lastMonthEnd;
    });
    
    const lastMonthCost = totalStorageCost + lastMonthBilling.reduce((sum, b) => sum + b.cost, 0);
    
    // Calculate projected month-end cost
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = currentDate.getDate();
    const projectedCost = currentMonth === currentDate.getMonth() + 1 && currentYear === currentDate.getFullYear()
      ? (currentMonthCost / currentDay) * daysInMonth
      : currentMonthCost;
    
    // Calculate trend
    let trend = 'stable';
    if (currentMonthCost > lastMonthCost * 1.1) {
      trend = 'up';
    } else if (currentMonthCost < lastMonthCost * 0.9) {
      trend = 'down';
    }
    
    res.json({
      monthToDate: currentMonthCost,
      projectedMonthEnd: projectedCost,
      lastMonth: lastMonthCost,
      trend: trend
    });
    
  } catch (error) {
    console.error('Get current billing error:', error);
    res.status(500).json({ error: 'Failed to fetch current billing data' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SkyCrate API is running' });
});

// AWS Test endpoint
app.get('/api/test-aws', async (req, res) => {
  if (DEV_MODE) {
    return res.json({ status: 'DEV_MODE', message: 'AWS testing disabled in dev mode' });
  }

  try {
    console.log('Testing AWS S3 connection...');
    const command = new ListBucketsCommand({});
    const result = await s3Client.send(command);
    res.json({
      status: 'SUCCESS',
      message: 'AWS S3 connection working',
      bucketCount: result.Buckets.length,
      region: AWS_REGION
    });
  } catch (error) {
    console.error('AWS Test Error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'AWS S3 connection failed',
      error: error.name,
      errorMessage: error.message,
      region: AWS_REGION
    });
  }
});

// Centralized error handler for Multer/CORS/etc.
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Unsupported file type') {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ error: 'CORS error: origin not allowed' });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});