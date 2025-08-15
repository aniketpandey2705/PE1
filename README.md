# SkyCrate - Cloud File Storage

A secure cloud file storage application built with React, Node.js, and AWS S3 with **intelligent storage class optimization**. Users can upload, manage, and share files with automatic cost optimization.

## 💰 NEW: AWS S3 Storage Class Selection

**Save up to 96% on AWS S3 costs!** SkyCrate now offers intelligent storage class selection with user choice:

- **Smart recommendations** based on file type and size
- **User choice** - select from all 6 AWS S3 storage classes
- **Real-time cost estimation** for every storage class option
- **Transparent pricing** with savings calculator
- **Cost analysis dashboard** to track your savings

**Available Storage Classes:**
- **STANDARD** ($0.023/GB/month) - Frequent access
- **STANDARD_IA** ($0.0125/GB/month) - 46% savings
- **ONEZONE_IA** ($0.01/GB/month) - 57% savings
- **GLACIER_IR** ($0.004/GB/month) - 83% savings
- **GLACIER** ($0.0036/GB/month) - 84% savings
- **DEEP_ARCHIVE** ($0.00099/GB/month) - 96% savings

**How it works:**
1. Upload a file → Storage class modal appears
2. See smart recommendation based on file type
3. Choose from all available storage classes
4. View estimated costs and savings
5. Upload with your selected storage class

See [`AWS_STORAGE_CLASSES.md`](./AWS_STORAGE_CLASSES.md) for detailed information.

## Features

- 🔐 **Secure Authentication**: JWT-based user authentication
- 💰 **Storage Class Selection**: Choose from all 6 AWS S3 storage classes with smart recommendations
- 📁 **File Management**: Upload, download, delete, and star files
- 🔒 **Private Storage**: Each user gets their own isolated S3 bucket
- 📱 **Responsive Design**: Modern UI that works on all devices
- ⚡ **Pre-signed URLs**: Secure file access without public exposure
- 📊 **Cost Analytics**: Real-time cost tracking and analysis
- 🤖 **Smart Recommendations**: Intelligent storage class suggestions based on file type and size
- 💡 **Cost Transparency**: See estimated monthly costs and savings for each storage class
- 🎯 **User Choice**: Full control over storage class selection with informed decision making

## Tech Stack

- **Frontend**: React, React Router, React Icons, React Dropzone
- **Backend**: Node.js, Express, JWT, bcryptjs
- **Cloud Storage**: AWS S3
- **File Upload**: Multer
- **Styling**: CSS3 with modern gradients and animations

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with S3 access
- AWS IAM user with S3 permissions

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd skycrate
   npm install
   ```

2. **Setup AWS credentials:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your AWS credentials:
   ```env
   JWT_SECRET=your_jwt_secret_here
   AWS_ACCESS_KEY_ID=your_aws_access_key_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
   AWS_REGION=us-east-1
   
   # Storage Class Selection (NEW)
   SHOW_STORAGE_CLASS_OPTIONS=true
   SHOW_STORAGE_RECOMMENDATIONS=true
   DEFAULT_STORAGE_CLASS=STANDARD
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Check your cost optimization:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/storage/cost-analysis
   ```

**That's it!** Your files will now be automatically stored in the most cost-effective S3 storage classes.

## New contributors setup

To ensure a smooth onboarding experience and consistent Git behavior across platforms:

- Windows users: this repo enforces LF line endings via `.gitattributes`. Configure Git to keep LF on commit:
  ```bash
  git config --global core.autocrlf input
  ```
  If you cloned the repo before this change and you see line-ending warnings, normalize your working tree once:
  ```bash
  git add --renormalize .
  git commit -m "Normalize line endings to LF"
  ```
- macOS/Linux users: no action needed; LF is the default.

Environment variables are provided in `env.example`. Copy it to `.env` and update the values before running locally.

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd skycrate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your AWS credentials:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
   AWS_REGION=us-east-1
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend (port 3000).


## 🎯 Storage Class Selection Configuration

Configure how users interact with AWS S3 storage classes:

```env
# Enable storage class selection modal for users
SHOW_STORAGE_CLASS_OPTIONS=true

# Show smart recommendations based on file type/size
SHOW_STORAGE_RECOMMENDATIONS=true

# Default storage class if user doesn't choose
DEFAULT_STORAGE_CLASS=STANDARD

# Recommendation thresholds and file types
RECOMMEND_STANDARD_IA_THRESHOLD_MB=100
RECOMMEND_GLACIER_EXTENSIONS=.zip,.rar,.tar,.gz,.7z,.bz2
RECOMMEND_GLACIER_IR_EXTENSIONS=.bak,.backup,.sql,.dump
RECOMMEND_STANDARD_EXTENSIONS=.jpg,.jpeg,.png,.gif,.mp4,.avi,.pdf,.doc,.docx
```

### Configuration Options:

- **`SHOW_STORAGE_CLASS_OPTIONS`**: Set to `true` to show storage class selection modal
- **`SHOW_STORAGE_RECOMMENDATIONS`**: Set to `true` to display smart recommendations
- **`DEFAULT_STORAGE_CLASS`**: Fallback storage class (STANDARD, STANDARD_IA, etc.)
- **Recommendation Rules**: Customize which file types get which recommendations

### User Experience:

- **Single file upload**: Shows storage class selection modal with recommendations
- **Multiple file upload**: Uses default storage class for smooth UX
- **Cost transparency**: Users see estimated monthly costs for each option
- **Smart suggestions**: Recommendations based on file type, size, and usage patterns

## AWS Setup (Optional - PAID)

Only needed if you choose `STORAGE_MODE=aws`. See [`COST_EFFECTIVE_STORAGE.md`](./COST_EFFECTIVE_STORAGE.md) for AWS setup details.

## Project Structure

```
skycrate/
├── public/                 # Static files
├── src/                   # React frontend
│   ├── components/        # React components
│   ├── services/          # API services
│   └── ...
├── server/               # Node.js backend
│   ├── data/             # Local data storage (gitignored)
│   └── index.js          # Express server
├── .env                  # Environment variables (gitignored)
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Files
- `POST /api/files/upload` - Upload file (with optional storageClass parameter)
- `GET /api/files` - Get user files
- `DELETE /api/files/:fileId` - Delete file
- `DELETE /api/files/bulk` - Bulk delete files/folders
- `PATCH /api/files/:fileId/star` - Toggle file star
- `GET /api/files/download/:userId/:fileName` - Download file (local storage)

### Storage Classes (NEW)
- `POST /api/storage/recommendations` - Get storage class recommendations for a file
- `GET /api/storage/cost-analysis` - Get detailed cost breakdown and recommendations

### Folders
- `POST /api/folders` - Create new folder
- `GET /api/folders` - Get user folders
- `DELETE /api/folders/:folderId` - Delete folder

### System
- `GET /api/user/profile` - Get user profile
- `GET /api/storage-info` - Get storage configuration and costs
- `GET /api/health` - Health check
- `GET /api/test-aws` - Test AWS S3 connection

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Isolated Storage**: Each user gets their own storage space
- **Secure File Access**: Protected file downloads and uploads
- **Input Validation**: Server-side validation for all inputs
- **Flexible Security**: Works with all storage backends

## Deployment

### FREE Production Deployment

```env
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret
PORT=5000
STORAGE_MODE=local
DATABASE_MODE=sqlite
USE_NEW_STORAGE=true
LOCAL_STORAGE_PATH=/var/app/storage
SQLITE_DB_PATH=/var/app/data/skycrate.db
```

### Build for Production

```bash
npm run build
```

### Testing Your Setup

```bash
# Test storage system
node test-storage.js

# Check storage info
curl http://localhost:5000/api/storage-info
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

## Security

If you discover any security vulnerabilities, please report them privately to the maintainers.

---

## 📚 Additional Documentation

- [`COST_EFFECTIVE_STORAGE.md`](./COST_EFFECTIVE_STORAGE.md) - Detailed guide for FREE storage setup
- [`env.example`](./env.example) - All configuration options explained
- [`test-storage.js`](./test-storage.js) - Test your storage configuration

## 🎯 Migration Guide

**From AWS S3 to FREE storage:**
1. Backup your S3 data
2. Change `STORAGE_MODE=local` and `USE_NEW_STORAGE=true`
3. Restart application
4. Re-upload files (now stored locally for FREE!)

**⚠️ Important**: Never commit your `.env` file to version control. The `.gitignore` file is configured to prevent this.

---

**🎉 Congratulations!** You can now run SkyCrate with **ZERO monthly storage costs** while maintaining all the functionality of the original AWS S3 version.