# 🚨 Gmail Authentication Fix

## The Problem

Gmail rejected your credentials with error 535 - "Username and Password not accepted"

## 🔧 Solution Steps

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", enable **2-Step Verification**
3. Complete the setup process

### 2. Generate App Password

1. Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select **"Mail"** from the dropdown
3. Select **"Other (Custom name)"** and enter "JobSync"
4. Click **Generate**
5. Copy the 16-character password (format: `abcd efgh ijkl mnop`)

### 3. Update .env File

Replace `your-16-character-app-password-here` in your `.env` file with the actual app password:

```env
EMAIL_PASS=abcd efgh ijkl mnop
```

### 4. Test the Server

```bash
npm start
```

## 🆘 If Still Not Working

### Option A: Check Account Settings

- Make sure 2FA is enabled
- Verify the app password is correct
- Try generating a new app password

### Option B: Use Different Email Provider

Update your `.env` with a different email service:

**Outlook:**

```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**Yahoo:**

```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-password
```

