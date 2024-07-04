// api/orders.js

const express = require("express");
const router = express.Router();
const connection = require("../db");
const { promisify } = require("util");

const queryAsync = promisify(connection.query).bind(connection);

// POST /api/orders
// Create a new order
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    // Insert the order into orders table
    const insertOrderQuery = `
      INSERT INTO orders (user_id, product_id, quantity, status, order_time)
      VALUES (?, ?, ?, 'Pending', NOW())
    `;

    const orderValues = [user_id, product_id, quantity];
    await queryAsync(insertOrderQuery, orderValues);

    // Deduct the product stock in products table
    const updateProductStockQuery = `
      UPDATE products
      SET stock = stock - ?
      WHERE product_id = ?
    `;

    const productValues = [quantity, product_id];
    await queryAsync(updateProductStockQuery, productValues);

    console.log("Order created successfully");
    res.status(201).json({ message: "Order created successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

module.exports = router;
