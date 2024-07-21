const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://root:admin@auth.kjyp6dp.mongodb.net/?retryWrites=true&w=majority&appName=Auth", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define user schema and model
const userSchema = new mongoose.Schema({
  EmpId: String,
  name: String,
  phone: String,
  email: String,
  password: String,
  employeeType: String,
  cart: {
    type: [{
      productId: String,
      status: Number,
    }],
    default: []
  }
});
const User = mongoose.model("User", userSchema);

// Define sales schema and model
const salesSchema = new mongoose.Schema({
  productId: String,
  quantity: Number,
});
const Sales = mongoose.model("Sales", salesSchema);

// Route to add or update a sale
app.post("/sales", async (req, res) => {
  try {
    const salesData = req.body; // Array of objects with productId and quantity

    // Iterate over each item in salesData to update or create
    for (const { productId, quantity } of salesData) {
      // Try to find an existing entry with the given productId
      let existingSale = await Sales.findOne({ productId });

      if (existingSale) {
        // If found, update the quantity
        existingSale.quantity = quantity;
        await existingSale.save();
      } else {
        // If not found, create a new entry
        existingSale = new Sales({ productId, quantity });
        await existingSale.save();
      }
    }

    res.status(200).json({ message: "Sales updated successfully!" });
  } catch (error) {
    console.error("Error updating sales:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

// Route to fetch all sales
app.get('/sales', async (req, res) => {
  try {
    const sales = await Sales.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Signup route
app.post("/signup", async (req, res) => {
  const { EmpId, name, phone, email, password, Cpassword, employeeType } = req.body;

  if (password !== Cpassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    const existingEmpId = await User.findOne({ EmpId });
    if (existingEmpId) {
      return res.status(400).json({ message: "Employee ID already exists!" });
    }

    const newUser = new User({
      EmpId,
      name,
      phone,
      email,
      password,
      employeeType,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});

// Fetch user by EmpId route
app.get('/users/:id', async (req, res) => {
  const empId = req.params.id;

  try {
    const user = await User.findOne({ EmpId: empId });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});

// Fetch all users route
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});

app.patch('/users/:EmpId/cart/:productId', async (req, res) => {
  const { EmpId, productId } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findOne({ EmpId });
    if (!user) return res.status(404).send('User not found');

    const item = user.cart.find(item => item.productId === productId);
    if (!item) return res.status(404).send('Cart item not found');

    item.status = status;
    await user.save();

    res.status(200).send('Cart item status updated');
  } catch (error) {
    console.error('Error updating cart item status:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to add to cart
app.post("/addToCart/:productId", async (req, res) => {
  const { productId } = req.params;
  const { EmpId } = req.body;

  try {
    // Validate EmpId and productId
    if (!EmpId || !productId) {
      return res.status(400).json({ message: "EmpId and productId are required!" });
    }

    // Find the user by EmpId
    const user = await User.findOne({ EmpId });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if the product already exists in the user's cart
    const existingCartItem = user.cart.find(item => item.productId === productId);

    if (existingCartItem) {
      user.cart.push({ productId, status: 0 });
    } else {
      user.cart.push({ productId, status: 0 });
    }

    // Save the updated user object with the cart changes
    await user.save();

    res.status(200).json({ message: "Item added to cart successfully!" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error!" });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
