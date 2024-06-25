const express = require("express");
const router = express.Router();
const connection = require("../db");

// Endpoint untuk membuat category baru
router.post("/", (req, res) => {
  const { title, description, slug, imageUrl } = req.body;
  const sql =
    "INSERT INTO category (title, description, imageUrl) VALUES (?, ?, ?, ?)";
  connection.query(
    sql,
    [title, description, imageUrl],
    (error, results) => {
      if (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
        return;
      }
      res
        .status(201)
        .json({
          message: "Category created successfully",
          id: results.insertId,
        });
    }
  );
});

// Endpoint untuk mengambil semua categories
router.get("/", (req, res) => {
  const sql = "SELECT * FROM category";
  connection.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;
