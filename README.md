# SkyCrate - Cloud File Storage

A secure cloud file storage application built with React, Node.js, and AWS S3. Users can upload, manage, and share files with automatic S3 bucket creation for each user.

## Features

- 🔐 **Secure Authentication**: JWT-based user authentication
- ☁️ **Cloud Storage**: Automatic S3 bucket creation for each user
- 📁 **File Management**: Upload, download, delete, and star files
- 🔒 **Private Storage**: Each user gets their own isolated S3 bucket
- 📱 **Responsive Design**: Modern UI that works on all devices
- ⚡ **Pre-signed URLs**: Secure file access without public exposure

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

## AWS Setup

### Required IAM Permissions

Your AWS user needs the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:PutBucketOwnershipControls",
                "s3:GetBucketOwnershipControls"
            ],
            "Resource": [
                "arn:aws:s3:::skycrate-*",
                "arn:aws:s3:::skycrate-*/*"
            ]
        }
    ]
}
```

### Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use IAM roles** instead of access keys in production
3. **Enable bucket encryption** for sensitive data
4. **Set up CloudTrail** for audit logging
5. **Use VPC endpoints** for enhanced security

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
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user files
- `DELETE /api/files/:fileId` - Delete file
- `PATCH /api/files/:fileId/star` - Toggle file star

### User
- `GET /api/user/profile` - Get user profile

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Private S3 Buckets**: Each user gets isolated storage
- **Pre-signed URLs**: Temporary, secure file access
- **ACL Disabled**: Modern S3 security practices
- **Input Validation**: Server-side validation for all inputs

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key
AWS_REGION=us-east-1
JWT_SECRET=your_very_secure_jwt_secret
PORT=5000
```

### Build for Production

```bash
npm run build
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

**⚠️ Important**: Never commit your `.env` file or AWS credentials to version control. The `.gitignore` file is configured to prevent this, but always double-check before pushing. 