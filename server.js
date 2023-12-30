const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors")
const Table = require("./model/Table");
const SaleReport = require("./model/SaleReport")

const app = express();

app.use(express.json())
app.use(cors())

mongoose.connect("mongodb://localhost:27017/blog").then(()=>{
 console.log("db connected")
}).catch(()=>{
    console.log("not connect");
})

app.get('/', function (req, res) {
  res.send('Hello World')
})


app.post("/add-table",async(req,res)=>{
    try {
      await Table.create({
        table:req.body.table,
        isOnline:false
      })
      res.json("created")
    } catch (error) {
      res.json(error)
    }
})

app.get("/single-table",async(req,res)=>{
  const {id} = req.query
  try {
    const data = await Table.findById({_id:id})
    res.json(data)
  } catch (error) {
    res.json(error)
  }
})

app.get("/single-table-delete",async(req,res)=>{
  const {id} = req.query
  try {
    await Table.findByIdAndDelete({_id:id})
    res.json({message:"Deleted Table"})
  } catch (error) {
    res.json(error)
  }
})

app.post("/add-order", async (req, res) => {
  const { id } = req.query;
  try {
    const order = await Table.findById(id);
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
  const { id } = req.query;
  const { orderId } = req.body; 

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
  const { id } = req.query;
  const { orderId, action } = req.body;
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

app.post("/payment-method", async (req, res) => {
  const { id } = req.query;
  const { paymentMethod, pickupAmount,returnAmount } = req.body;
  
  try {
    const order = await Table.findById(id);
    if (order) {
      const previousDetails = {
        table: order.table,
        basket: order.basket,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        pickupAmount: order.pickupAmount,
        returnAmount: order.returnAmount
      };

      order.paymentMethod = paymentMethod;
      order.pickupAmount = pickupAmount;
      order.returnAmount = returnAmount;

      const updatedOrder = await order.save();

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

      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/delete",(req,res)=>{
  SaleReport.collection.drop((err, result) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred while dropping the collection' });
    }
    // If the collection is dropped successfully
    res.json({ message: 'Variant collection has been dropped' });
  });
})


app.listen(3002,()=>{
    console.log("server Start");
})