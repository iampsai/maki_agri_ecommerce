const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");
const { sendEmail } = require("../utils/emailService");

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
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    let user;

    // If the user exists but is not verified, update the existing user

    const existingUser = await User.findOne({ email: email });
    const existingUserByPh = await User.findOne({ phone: phone });

    if (existingUser) {
      res.json({
        status: "FAILED",
        msg: "User already exist with this email!",
      });
      return;
    }

    if (existingUserByPh) {
      res.json({
        status: "FAILED",
        msg: "User already exist with this phone number!",
      });
      return;
    }

    if (existingUser) {
      const hashPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashPassword;
      existingUser.otp = verifyCode;
      existingUser.otpExpires = Date.now() + 600000; // 10 minutes
      await existingUser.save();
      user = existingUser;
    } else {
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
    }

    // Send verification email
    const resp = sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + verifyCode
    );

    // Create a JWT token for verification purposes
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    // res.cookie('token', token, {
    //     httpOnly: false,
    //     sameSite: "none",0
    //     secure: true,
    //     maxAge: 3600000,
    // });

    // Send success response
    return res.status(200).json({
      success: true,
      message: "User registered successfully! Please verify your email.",
      token: token, // Optional: include this if needed for verification
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "something went wrong" });
    return;
  }
});

router.post(`/verifyAccount/resendOtp`, async (req, res) => {
  const { email } = req.body;

  try {
    // Generate verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // If the user exists but is not verified, update the existing user

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "OTP SEND",
        otp: verifyCode,
        existingUserId: existingUser._id,
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "something went wrong" });
    return;
  }
});

router.put(`/verifyAccount/emailVerify/:id`, async (req, res) => {
  const { email, otp } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    console.log(existingUser);

    if (existingUser) {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          name: existingUser.name,
          email: email,
          phone: existingUser.phone,
          password: existingUser.password,
          images: existingUser.images,
          isAdmin: existingUser.isAdmin,
          isVerified: existingUser.isVerified,
          otp: otp,
          otpExpires: Date.now() + 600000,
        },
        { new: true }
      );
    }

    // Send verification email
    const resp = sendEmailFun(email, "Verify Email", "", "Your OTP is " + otp);

    // Create a JWT token for verification purposes
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    // Send success response
    return res.status(200).json({
      success: true,
      message: "OTP SEND",
      token: token, // Optional: include this if needed for verification
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
  const { name, phone, email } = req.body;

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
      images: imagesArr,
    },
    { new: true }
  );

  if (!user) return res.status(400).send("the user cannot be Updated!");

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
    // Generate verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // If the user exists but is not verified, update the existing user

    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      res.json({ status: "FAILED", msg: "User not exist with this email!" });
      return;
    }

    if (existingUser) {
      existingUser.otp = verifyCode;
      existingUser.otpExpires = Date.now() + 600000; // 10 minutes
      await existingUser.save();
    }

    // Send verification email
    const resp = sendEmailFun(
      email,
      "Verify Email",
      "",
      "Your OTP is " + verifyCode
    );

    // Send success response
    return res.status(200).json({
      success: true,
      status: "SUCCESS",
      message: "OTP Send",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "something went wrong" });
    return;
  }
});

router.post(`/forgotPassword/changePassword`, async (req, res) => {
  const { email, newPass } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      const hashPassword = await bcrypt.hash(newPass, 10);
      existingUser.password = hashPassword;
      await existingUser.save();
    }

    // Send success response
    return res.status(200).json({
      success: true,
      status: "SUCCESS",
      message: "Password change successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ status: "FAILED", msg: "something went wrong" });
    return;
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
