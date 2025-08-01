const express = require('express');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AWS Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Data storage files
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');

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

// Initialize storage on startup
initializeStorage();

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

    // Generate unique bucket name
    const bucketName = `skycrate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create S3 bucket
    try {
      await s3.createBucket({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION === 'us-east-1' ? undefined : process.env.AWS_REGION
        }
      }).promise();

      // Disable ACLs on the bucket
      await s3.putBucketOwnershipControls({
        Bucket: bucketName,
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced'
            }
          ]
        }
      }).promise();

      console.log(`S3 bucket created: ${bucketName}`);

    } catch (error) {
      console.error('Error creating S3 bucket:', error);
      return res.status(500).json({ error: 'Failed to create storage bucket' });
    }

    // Create user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      username,
      awsBucketName: bucketName,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

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

// Upload File
app.post('/api/files/upload', authenticateToken, multer().single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype, size } = req.file;
    const fileName = `${Date.now()}-${originalname}`;
    const s3Key = `uploads/${fileName}`;

    // Upload to S3
    const uploadParams = {
      Bucket: req.user.awsBucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: mimetype
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Generate pre-signed URL for download
    const signedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: req.user.awsBucketName,
      Key: s3Key,
      Expires: 3600 // 1 hour
    });

    // Save file info to storage
    const files = await readFiles();
    const newFile = {
      id: Date.now().toString(),
      userId: req.user.id,
      fileName: fileName,
      originalName: originalname,
      fileSize: size,
      fileType: mimetype,
      s3Key: s3Key,
      bucketName: req.user.awsBucketName,
      uploadDate: new Date().toISOString(),
      isStarred: false
    };

    files.push(newFile);
    await writeFiles(files);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: newFile.id,
        fileName: newFile.fileName,
        originalName: newFile.originalName,
        fileSize: newFile.fileSize,
        fileType: newFile.fileType,
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
    const files = await readFiles();
    const userFiles = files.filter(f => f.userId === req.user.id);
    
    const filesWithUrls = await Promise.all(userFiles.map(async (file) => {
      // Generate pre-signed URL for each file
      const signedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: file.bucketName,
        Key: file.s3Key,
        Expires: 3600 // 1 hour
      });

      return {
        id: file.id,
        fileName: file.fileName,
        originalName: file.originalName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadDate: file.uploadDate,
        isStarred: file.isStarred,
        url: signedUrl
      };
    }));

    res.json(filesWithUrls);

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete File
app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const files = await readFiles();
    const file = files.find(f => f.id === req.params.fileId && f.userId === req.user.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from S3
    await s3.deleteObject({
      Bucket: file.bucketName,
      Key: file.s3Key
    }).promise();

    // Delete from storage
    const updatedFiles = files.filter(f => f.id !== req.params.fileId);
    await writeFiles(updatedFiles);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
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

    files[fileIndex].isStarred = !req.body.isStarred;
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

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { password, ...userProfile } = req.user;
    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SkyCrate API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 