// coupon.js

const express = require("express");
const router = express.Router();
const connection = require("../db");

// Endpoint untuk membuat coupon baru
router.post("/", (req, res) => {
  const { title, expiryDate, couponCode } = req.body;
  const sql =
    "INSERT INTO coupon (coup_title, coup_date, coup_id) VALUES (?, ?, ?)";
  connection.query(sql, [title, expiryDate, couponCode], (error, results) => {
    if (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ error: "Failed to create coupon" });
      return;
    }
    res.status(201).json({
      message: "Coupon created successfully",
      id: results.insertId,
    });
  });
});

// Endpoint untuk mengambil semua coupons
router.get("/", (req, res) => {
  const sql = "SELECT * FROM coupon";
  connection.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ error: "Failed to fetch coupons" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;
