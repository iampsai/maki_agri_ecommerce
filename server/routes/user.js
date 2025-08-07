const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");
const { sendEmail } = require("../utils/emailService");
const { generateOTP, sendOTPVerification } = require("../utils/smsService");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const fs = require("fs");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

var imagesArr = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
    //imagesArr.push(`${Date.now()}_${file.originalname}`)
  },
});

const upload = multer({ storage: storage });

router.post(`/upload`, upload.array("images"), async (req, res) => {
  imagesArr = [];

  try {
    for (let i = 0; i < req?.files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const img = await cloudinary.uploader.upload(
        req.files[i].path,
        options,
        function (error, result) {
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    let imagesUploaded = new ImageUpload({
      images: imagesArr,
    });

    imagesUploaded = await imagesUploaded.save();
    return res.status(200).json(imagesArr);
  } catch (error) {
    console.log(error);
  }
});

router.post(`/signup`, async (req, res) => {
  const { name, phone, email, password, isAdmin } = req.body;

  try {
    // Generate verification code
    const verifyCode = generateOTP();
    let user;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    const existingUserByPh = await User.findOne({ phone: phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email!",
      });
    }

    if (existingUserByPh) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number!",
      });
    }

    // Create a new user
    const hashPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      phone,
      password: hashPassword,
      isAdmin,
      otp: verifyCode,
      otpExpires: Date.now() + 600000, // 10 minutes
    });

    await user.save();

    // Send verification via both email and SMS
    const emailPromise = sendEmail(
      email,
      "Verify Your Account",
      "",
      `Your OTP for Rich Agri Supply account verification is: ${verifyCode}`
    );

    const smsPromise = sendOTPVerification(phone, verifyCode);

    // Wait for both notifications to be sent
    await Promise.all([emailPromise, smsPromise]);

    // Create a JWT token for verification purposes
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Registration successful! Please verify your account with the OTP sent to your phone and email.",
      token: token,
      userId: user._id // Include the userId in the response
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred during registration. Please try again." 
    });
  }
});

router.post(`/verifyAccount/resendOtp`, async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Generate new verification code
    const verifyCode = generateOTP();

    // Update user with new OTP
    existingUser.otp = verifyCode;
    existingUser.otpExpires = Date.now() + 600000; // 10 minutes
    await existingUser.save();

    // Send verification via both email and SMS
    const emailPromise = sendEmail(
      email,
      "Verify Your Account",
      "",
      `Your new OTP for Rich Agri Supply account verification is: ${verifyCode}`
    );

    const smsPromise = sendOTPVerification(existingUser.phone, verifyCode);

    // Wait for both notifications to be sent
    await Promise.all([emailPromise, smsPromise]);

    return res.status(200).json({
      success: true,
      message: "New OTP has been sent to your phone and email.",
      existingUserId: existingUser._id,
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while resending OTP. Please try again." 
    });
  }
});

router.post(`/verifyAccount/verify/:id`, async (req, res) => {
  console.log('Verification request received:', {
    userId: req.params.id,
    body: req.body
  });

  const { email, otp } = req.body;

  try {
    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required."
      });
    }

    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    const user = await User.findOne({ 
      _id: req.params.id,
      email: email
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with the provided ID and email."
      });
    }

    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }

    // Update user verification status
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        otp: null,
        otpExpires: null
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to update user verification status."
      });
    }

    // Create a JWT token for the verified user
    const token = jwt.sign(
      { email: updatedUser.email, id: updatedUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Account verified successfully! You can now log in.",
      token: token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "something went wrong" });
    return;
  }
});

const sendEmailFun = async (to, subject, text, html) => {
  const result = await sendEmail(to, subject, text, html);
  if (result.success) {
    return true;
    //res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
  } else {
    return false;
    // res.status(500).json({ message: 'Failed to send email', error: result.error });
  }
};

router.post("/verifyemail", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();

    if (isCodeValid && isNotExpired) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "OTP verified successfully" });
    } else if (!isCodeValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    } else {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
  } catch (err) {
    console.log("Error in verifyEmail", err);
    res
      .status(500)
      .json({ success: false, message: "Error in verifying email" });
  }
});

router.post(`/signin`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      res.status(404).json({ error: true, msg: "User not found!" });
      return;
    }

    if (existingUser.isVerified === false) {
      res.json({
        error: true,
        isVerify: false,
        msg: "Your account is not active yet please verify your account first or Sign Up with a new user",
      });
      return;
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
      return res.status(400).json({ error: true, msg: "Invailid credentials" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    return res.status(200).send({
      user: existingUser,
      token: token,
      msg: "User Authenticated",
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: "something went wrong" });
    return;
  }
});

router.put(`/changePassword/:id`, async (req, res) => {
  const { name, phone, email, password, newPass, images } = req.body;

  // console.log(req.body)

  const existingUser = await User.findOne({ email: email });
  if (!existingUser) {
    res.status(404).json({ error: true, msg: "User not found!" });
  }

  const matchPassword = await bcrypt.compare(password, existingUser.password);

  if (!matchPassword) {
    res.status(404).json({ error: true, msg: "current password wrong" });
  } else {
    let newPassword;

    if (newPass) {
      newPassword = bcrypt.hashSync(newPass, 10);
    } else {
      newPassword = existingUser.passwordHash;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        phone: phone,
        email: email,
        password: newPassword,
        images: images,
      },
      { new: true }
    );

    if (!user)
      return res
        .status(400)
        .json({ error: true, msg: "The user cannot be Updated!" });

    res.send(user);
  }
});

router.get(`/`, async (req, res) => {
  const userList = await User.find();

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  } else {
    res.status(200).send(user);
  }
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "user not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

router.post(`/authWithGoogle`, async (req, res) => {
  const { name, phone, email, password, images, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      const result = await User.create({
        name: name,
        phone: phone,
        email: email,
        password: password,
        images: images,
        isAdmin: isAdmin,
        isVerified: true,
      });

      const token = jwt.sign(
        { email: result.email, id: result._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).send({
        user: result,
        token: token,
        msg: "User Login Successfully!",
      });
    } else {
      const existingUser = await User.findOne({ email: email });
      const token = jwt.sign(
        { email: existingUser.email, id: existingUser._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY
      );

      return res.status(200).send({
        user: existingUser,
        token: token,
        msg: "User Login Successfully!",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/:id", async (req, res) => {
  const { name, phone, email, images, billingAddress } = req.body;

  const userExist = await User.findById(req.params.id);

  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: name,
      phone: phone,
      email: email,
      password: newPassword,
      images: images,
      billingAddress: {
        fullName: billingAddress?.fullName?.trim() || '',
        country: billingAddress?.country?.trim() || '',
        streetAddressLine1: billingAddress?.streetAddressLine1?.trim() || '',
        streetAddressLine2: billingAddress?.streetAddressLine2?.trim() || '',
        city: billingAddress?.city?.trim() || '',
        state: billingAddress?.state?.trim() || '',
        zipCode: billingAddress?.zipCode?.trim() || ''
      }
    },
    { new: true }
  );

  if (!user) return res.status(400).send("The user cannot be updated!");

  res.send(user);
});

router.delete("/deleteImage", async (req, res) => {
  const imgUrl = req.query.img;

  // console.log(imgUrl)

  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];

  const imageName = image.split(".")[0];

  const response = await cloudinary.uploader.destroy(
    imageName,
    (error, result) => {
      // console.log(error, res)
    }
  );

  if (response) {
    res.status(200).send(response);
  }
});

router.post(`/forgotPassword`, async (req, res) => {
  const { email } = req.body;

  try {
    // Generate verification code using our OTP generator
    const verifyCode = generateOTP();

    // Check if user exists
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: "No account found with this email address." 
      });
    }

    // Update user with new OTP
    existingUser.otp = verifyCode;
    existingUser.otpExpires = Date.now() + 600000; // 10 minutes
    await existingUser.save();

    // Format phone number for Philippines format if needed
    let formattedPhone = existingUser.phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.replace('0', '63');
    }

    // Send verification via both email and SMS
    const emailPromise = sendEmail(
      email,
      "Password Reset Request",
      "",
      `Your OTP for password reset is: ${verifyCode}. This code will expire in 10 minutes.`
    );

    const smsPromise = sendOTPVerification(formattedPhone, verifyCode);

    // Wait for both notifications to be sent
    await Promise.all([emailPromise, smsPromise]);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email and phone number.",
      userId: existingUser._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false,
      message: "An error occurred while processing your request. Please try again." 
    });
  }
});

router.post(`/forgotPassword/changePassword`, async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Find user and verify OTP
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again."
      });
    }

    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Hash new password and update user
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Send success response
    return res.status(200).json({
      success: true,
      status: "SUCCESS",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      status: "FAILED",
      message: "Something went wrong. Please try again."
    });
  }
});

// Billing Address Routes
router.post('/billing-address/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                billingAddress: {
                    fullName: req.body.fullName,
                    country: req.body.country,
                    streetAddressLine1: req.body.streetAddressLine1,
                    streetAddressLine2: req.body.streetAddressLine2,
                    city: req.body.city,
                    state: req.body.state,
                    zipCode: req.body.zipCode,
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/billing-address/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.billingAddress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin-specific user management routes - Add middleware to verify admin role
const verifyAdminRole = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No token provided in authorization header");
      return res.status(401).json({
        success: false,
        msg: "Unauthorized - No token provided"
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log("Verifying admin token...");
    
    // Use the same secret key that was used to sign the token
    // This must match the key used in the signin route
    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY, async (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.message);
        return res.status(401).json({
          success: false,
          msg: "Unauthorized - Invalid token"
        });
      }
      
      console.log("Decoded token payload:", decoded);
      
      // Get user ID from token - handle different token formats
      // In the signin route, the ID is stored as 'id'
      const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
      
      if (!userId) {
        console.error("No user ID found in token payload");
        return res.status(401).json({
          success: false,
          msg: "Invalid token format - user ID not found"
        });
      }
      
      console.log("Looking up user with ID:", userId);
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error("User not found with ID:", userId);
        return res.status(404).json({
          success: false,
          msg: "User not found"
        });
      }
      
      console.log("User found:", user.email, "Role:", user.role, "isAdmin:", user.isAdmin);
      
      // Check if user has admin role
      const isAdmin = user.role === 'admin' || user.isAdmin === true;
      
      if (!isAdmin) {
        console.error("User does not have admin privileges:", user.email);
        return res.status(403).json({
          success: false,
          msg: "Forbidden - Admin privileges required"
        });
      }
      
      console.log("Admin authorization successful for:", user.email);
      
      // Admin user verified, proceed
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Error in admin verification middleware:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error during authorization check: " + error.message
    });
  }
};

// Apply admin verification middleware to admin routes
router.post(`/admin/create`, verifyAdminRole, async (req, res) => {
  try {
    const { name, phone, email, password, role, isAdmin, isVerified, images } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "User with this email already exists",
      });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);
    
    // Create new user with role support
    const user = new User({
      name,
      email,
      phone,
      password: hashPassword,
      images: images || [],
      role: role || 'user',
      isAdmin: role === 'admin' || isAdmin || false, // Set isAdmin based on role for backward compatibility
      isVerified: isVerified || false,
    });

    await user.save();

    // Send success response
    return res.status(201).json({
      success: true,
      msg: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      msg: "Something went wrong while creating user",
    });
  }
});

router.put(`/admin/:id`, verifyAdminRole, async (req, res) => {
  try {
    const { name, phone, email, password, role, isAdmin, isVerified, images } = req.body;
    const userId = req.params.id;

    console.log("Update user request:", { userId, role, isAdmin, name, email });

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    // If email is changed, check if new email already exists
    if (email !== existingUser.email) {
      const userWithNewEmail = await User.findOne({ email });
      if (userWithNewEmail && userWithNewEmail._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          msg: "Email already in use by another user",
        });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      role: role || existingUser.role || (existingUser.isAdmin ? 'admin' : 'user'),
      isAdmin: role === 'admin' || isAdmin || existingUser.isAdmin,
      isVerified: isVerified !== undefined ? isVerified : existingUser.isVerified,
    };

    // If images are provided, update them
    if (images && images.length > 0) {
      updateData.images = images;
    }

    // If password is provided, hash and update it
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    console.log("Updating user with data:", updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error("User update failed - user not found after update");
      return res.status(404).json({
        success: false,
        msg: "User not found after update",
      });
    }

    console.log("User updated successfully:", {
      id: updatedUser.id,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin
    });

    return res.status(200).json({
      success: true,
      msg: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      msg: `Error updating user: ${error.message || "Unknown error"}`,
    });
  }
});

module.exports = router;