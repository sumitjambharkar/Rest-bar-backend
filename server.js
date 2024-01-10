const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const Table = require("./model/Table");
const SaleReport = require("./model/SaleReport");
const Product = require('./model/Product');
const User = require("./model/User");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')
dotenv.config()
const app = express();

const port = process.env.PORT


app.use(express.json())
app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:3000','https://cafedinner.com'],
  })
);
app.use(express.static('public'));
app.use(cookieParser());


mongoose.connect(process.env.DATABASE).then(()=>{
 console.log("db connected")
}).catch(()=>{
    console.log("not connect");
})

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user with the provided email exists
    const user = await User.findOne({ email });

    if (user) {
      // User found, compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"10m"})
        res.cookie("JWT",token,{
          path:'/',
          expires: new Date(Date.now() + 1000 * 60 * 10),
          httpOnly:true,
          sameSite:"lax"
        })
        res.json({message:"Login",id:user._id,token})
      } else {
        res.json({ message: "Password does not match" });
      }
    } else {
      // User not found, create a new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword,
        role: "Admin",
        status: "Active"
      });
      res.json({ message: "Admin user created successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.cookies.JWT;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = decoded.id;
    next();
  });
};

app.get("/show-users",async(req,res)=>{
   try {
    const users = await User.find()
    res.json(users)
   } catch (error) {
    res.json({message:error})
   }
})

app.put("/update/user", async (req, res) => {
  const { id ,status} = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        status:status
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/delete/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/user', verifyToken, async (req, res) => {
  try {
    const id = req.userId;
    const user = await User.findById(id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/add-table",verifyToken,async(req,res)=>{
    try {
      await Table.create({
        table:req.body.table,
        isOnline:false,
        author:req.userId
      })
      res.json("created")
    } catch (error) {
      res.json(error)
    }
})

app.get("/show-table", verifyToken, async (req, res) => {
  try {
    const data = await Table.find({ author: req.userId }).populate('author');
    res.json(data);
  } catch (error) {
    res.json(error);
  }
});

app.get("/single-table",async(req,res)=>{
  const {id} = req.query
  try {
    const data = await Table.findById({_id:id})
    res.json(data)
  } catch (error) {
    res.json(error)
  }
})

app.post("/create-product",verifyToken,async(req,res)=>{
    try {
      await Product.create({
        name:req.body.name,
        price:req.body.price,
        author:req.userId,
        isOnline:true
      })
      res.json({message:"Product Created"})
    } catch (error) {
      res.json(error)
    }
})

app.get("/show-all-product",verifyToken,async(req,res)=>{
  try {
    const data = await Product.find({author:req.userId}).populate("author")
    res.json(data)
  } catch (error) {
    res.json(error)
  }
})

app.get("/show-single-product",async(req,res)=>{
  const {id} = req.query
  try {
    const data = await Product.findById({_id:id})
    res.json(data)
  } catch (error) {
    res.json(error)
  }
})

app.put("/update-single-product", async (req, res) => {
  const { id ,name,price,isOnline} = req.body;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name:name,
        price:price,
        isOnline:isOnline
      },
      { new: true }
    );
    if (updatedProduct) {
      res.json({ message: "Product updated successfully", updatedProduct });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.delete("/delete-single-product",async(req,res)=>{
  const {id} = req.query
   try {
    await Product.findByIdAndDelete({_id:id})
    res.json({message:"Deleted Product"})
   } catch (error) {
    res.json(error.message)
   }
})

app.delete("/single-table-delete", verifyToken, async (req, res) => {
  try {
    const result = await Table.findOneAndDelete({ table:req.body.table,author:req.userId});

    if (!result) {
      return res.status(404).json({ message: "No matching record found for deletion" });
    }

    res.json({ message: "Deleted Table" });
  } catch (error) {
    res.status(500).json(error.message);
  }
});


app.post("/add-order", async (req, res) => {
  try {
    const order = await Table.findById({_id:req.body.id});
    if (order) {
      let itemFound = false;
      order.basket.forEach((item) => {
        if (item.name === req.body.name) {
          item.qty += parseInt(req.body.qty);
          item.total = item.qty * item.price;
          itemFound = true;
        }
      });
      if (!itemFound) {
        order.basket.push({
          name: req.body.name,
          price: req.body.price,
          qty: req.body.qty,
          total: req.body.qty * req.body.price
        });
      }
      const totalAmount = order.basket.reduce((acc, item) => acc + item.total, 0);
      order.totalAmount = totalAmount;
      order.isOnline = true;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/basket-order-remove", async (req, res) => {
  const { orderId,id } = req.body; 

  try {
    const order = await Table.findById(id); 

    if (order) {
      order.basket = order.basket.filter((item) => item._id.toString() !== orderId.toString());

      order.totalAmount = order.basket.reduce((acc, item) => acc + item.total, 0);

      if (order.basket.length === 0) {
        order.isOnline = false;
      }

      const updatedOrder = await order.save();

      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json(error); 
  }
});

app.post("/basket-order-increment-decrement", async (req, res) => {
  const { orderId, action,id } = req.body;
  try {
    const order = await Table.findById(id);

    if (order) {
      const itemToUpdate = order.basket.find(item => item._id.toString() === orderId);

      if (itemToUpdate) {
        if (action === 'increment') {
          itemToUpdate.qty += 1;
        } else if (action === 'decrement' && itemToUpdate.qty > 0) {
          itemToUpdate.qty -= 1;
        }

        itemToUpdate.total = itemToUpdate.qty * itemToUpdate.price;

        if (itemToUpdate.qty === 0) {
          order.basket = order.basket.filter(item => item._id.toString() !== orderId);
        }

        order.totalAmount = order.basket.reduce((acc, item) => acc + item.total, 0);

        const updatedOrder = await order.save();

        res.json(updatedOrder);
      } else {
        res.status(404).json({ error: 'Item not found in the basket' });
      }
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post("/payment-method",verifyToken, async (req, res) => {
  const { paymentMethod, pickupAmount,returnAmount,id } = req.body;
  try {
    const order = await Table.findById(id);
    if (order) {
      const previousDetails = {
        table: order.table,
        basket: order.basket,
        totalAmount: order.totalAmount,
        paymentMethod:paymentMethod,
        pickupAmount:pickupAmount,
        returnAmount:returnAmount,
        author:req.userId
      };

      await SaleReport.create(previousDetails);

      await Table.findByIdAndUpdate(id, {
        $set: { isOnline: false },
        $unset: {
          basket: "",
          totalAmount: "",
          paymentMethod: "",
          pickupAmount: "",
          returnAmount: ""
        }
      });

      res.json(previousDetails);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sale-report",verifyToken,async(req,res)=>{
  try {
    const result = await SaleReport.find({author:req.userId}).populate("author")
    res.json(result)
  } catch (error) {
    res.json(error)
  }
})

app.get("/delete",(req,res)=>{
  SaleReport.collection.drop((err, result) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred while dropping the collection' });
    }
    // If the collection is dropped successfully
    res.json({ message: 'Variant collection has been dropped' });
  });
})


app.listen(port,()=>{
    console.log("server Start");
})