const express = require("express");
const router = express.Router();
const connection = require("../db");
const { promisify } = require("util");

const queryAsync = promisify(connection.query).bind(connection);

// POST /api/products
// Create a new product
router.post("/", async (req, res) => {
  try {
    const { product_name, description, price, stock, image_url, cat_id } =
      req.body;

    const query = `
      INSERT INTO products (product_name, description, price, stock, image, cat_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      product_name,
      description,
      price,
      stock,
      image_url,
      cat_id,
    ];

    const results = await queryAsync(query, values);

    console.log("Product created successfully:", results);
    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

module.exports = router;
