const express = require("express");
const { tanyabal } = require("./balisai");
const connection = require("./db");
const cors = require("cors");
const { getOrderData } = require("./smallcard");
const { getOrderStats } = require("./largecard");
const { getPieChartData } = require("./piechart");
const { getOrdersData, getSalesData } = require("./linechart");
const { getDetailedOrders } = require("./table");
const categoriesRouter = require("./api/categories");
const couponsRouter = require("./api/coupon");
const multer = require("multer");
const path = require("path");
const productsRouter = require("./api/products");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit
}).single("image");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/coupons", couponsRouter);

app.post("/upload-image", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const imageUrl = `http://localhost:3002/uploads/${req.file.filename}`;
    res.status(200).json({ url: imageUrl });
  });
});

// backend/index.js

app.post("/api/products", (req, res) => {
  const {
    product_name,
    description,
    stock,
    price,
    image_url,
    category_id // Pastikan ini sesuai dengan nama field di tabel products
  } = req.body;

  const query =
    "INSERT INTO products (product_name, description, price, stock, image, cat_id) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [
    product_name,
    description,
    price,
    stock,
    image_url,
    category_id, // Pastikan ini diambil dari req.body
  ];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ error: "Failed to create product" });
    }
    console.log("Product created successfully:", results);
    res.status(201).json({
      message: "Product created successfully",
      productId: results.insertId,
    });
  });
});


app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    res.json(results);
  });
});

app.get("/orders", (req, res) => {
  getOrderData((err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
    res.json(results);
  });
});

app.get("/orders-data", async (req, res) => {
  try {
    const results = await getDetailedOrders();
    res.json(results);
  } catch (error) {
    console.error("Error fetching orders data:", error);
    res.status(500).json({ error: "Failed to fetch orders data" });
  }
});

app.get("/pie-chart-data", (req, res) => {
  getPieChartData((err, results) => {
    if (err) {
      console.error("Error fetching pie chart data:", err);
      return res.status(500).json({ error: "Failed to fetch pie chart data" });
    }
    res.json(results);
  });
});

// Endpoint to get products with low stock
app.get("/api/low-stock-products", (req, res) => {
  const query = "SELECT * FROM products WHERE stock <= 100";
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching low stock products:", error);
      return res.status(500).json({ error: "Failed to fetch low stock products" });
    }
    res.json(results);
  });
});

app.get("/sales-data", (req, res) => {
  getSalesData((err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      return res.status(500).json({ error: "Failed to fetch sales data" });
    }
    res.json(results);
  });
});

app.get("/orders-data-line", (req, res) => {
  getOrdersData((err, results) => {
    if (err) {
      console.error("Error fetching orders data:", err);
      return res.status(500).json({ error: "Failed to fetch orders data" });
    }
    res.json(results);
  });
});

app.get("/order-stats", (req, res) => {
  getOrderStats((err, results) => {
    if (err) {
      console.error("Error fetching order stats:", err);
      return res.status(500).json({ error: "Failed to fetch order stats" });
    }
    res.json(results);
  });
});

app.get("/kpi-ai", async (req, res) => {
  try {
    const query = `
      SELECT 
          DATE_FORMAT(order_time, '%Y-%m') AS month,
          SUM(quantity) AS total_sales
      FROM 
          orders
      GROUP BY 
          DATE_FORMAT(order_time, '%Y-%m')
      ORDER BY
          DATE_FORMAT(order_time, '%Y-%m');
    `;

    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Maret",
      "04": "April",
      "05": "Mei",
      "06": "Juni",
      "07": "Juli",
      "08": "Agustus",
      "09": "September",
      10: "Oktober",
      11: "November",
      12: "Desember",
    };

    connection.query(query, async (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return res.status(500).json({ error: "Failed to execute query" });
      }

      const formattedResults = results.map((row) => {
        const [year, month] = row.month.split("-");
        const monthName = monthNames[month];
        return `bulan ${monthName} ${row.total_sales}`;
      });

      const salesDataText = formattedResults.join(", ");

      const lastMonth = results[results.length - 1].month;
      const [lastYear, lastMonthNumber] = lastMonth.split("-");
      const nextMonthNumber = (parseInt(lastMonthNumber) % 12) + 1;
      const nextYear =
        nextMonthNumber === 1 ? parseInt(lastYear) + 1 : lastYear;
      const nextMonth = `${nextYear}-${String(nextMonthNumber).padStart(
        2,
        "0"
      )}`;
      const nextMonthName =
        monthNames[String(nextMonthNumber).padStart(2, "0")];

      const promptText = `Ini adalah data penjualan saya: ${salesDataText}.
6. Berikan rekomendasi jumlah KPI untuk setiap bulan. Tambahkan juga prediksi untuk bulan ${nextMonthName} ${nextYear}. Format: KPI Bulan [nama bulan]: [jumlah].`;

      console.log("Prompt text:", promptText);

      const aiResponse = await tanyabal(promptText);
      const matchedKpiData = aiResponse.match(/KPI Bulan \w+: \d+/g);

      if (!matchedKpiData) {
        return res
          .status(500)
          .json({ error: "Failed to extract KPI data from AI response" });
      }

      const kpiData = matchedKpiData.map((kpi) => {
        const [month, value] = kpi.split(": ");
        return {
          month: month.replace("KPI Bulan ", ""),
          value: parseInt(value),
        };
      });

      // Tambahkan prediksi untuk bulan berikutnya
      if (
        !kpiData.find((item) => item.month === `${nextMonthName} ${nextYear}`)
      ) {
        kpiData.push({
          month: `${nextMonthName} ${nextYear}`,
          value: 0, // atau nilai default lainnya jika tidak ada prediksi
        });
      }

      res.status(200).json(kpiData);
    });
  } catch (error) {
    console.error("Error in kpi-ai endpoint:", error);
    res.status(500).json({ error: "Error processing AI request" });
  }
});


app.get("/askAI", async (req, res) => {
  try {
    const query = `SELECT 
            DATE_FORMAT(order_time, '%Y-%m') AS month,
            SUM(quantity) AS total_sales
        FROM 
            orders
        GROUP BY 
            DATE_FORMAT(order_time, '%Y-%m');
        `;

    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Maret",
      "04": "April",
      "05": "Mei",
      "06": "Juni",
      "07": "Juli",
      "08": "Agustus",
      "09": "September",
      10: "Oktober",
      11: "November",
      12: "Desember",
    };

    connection.query(query, async (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return res.status(500).json({ error: "Failed to execute query" });
      }

      const formattedResults = results.map((row) => {
        const [year, month] = row.month.split("-");
        const monthName = monthNames[month];
        return `bulan ${monthName} ${row.total_sales}`;
      });

      const salesDataText = formattedResults.join(", ");

      const promptText = `Ini adalah data penjualan saya: ${salesDataText}.
Berapa total penjualan untuk setiap bulan? Bandingkan kinerja penjualan antara bulan.Berikan rekomendasi produk untuk dijual bulan depan. Format: Inilah rekomendasi saya untuk jumlah produk yang harus dijual: [jumlah]. Rekomendasikan strategi pemasaran yang sesuai untuk menjual jersey dan merchandise.`;

      console.log("Prompt text:", promptText);

      const aiResponse = await tanyabal(promptText);

      res.status(200).json({ aiResponse });
    });
  } catch (error) {
    console.error("Error in askAI endpoint:", error);
    res.status(500).json({ error: "Error processing AI request" });
  }
});
// Endpoint to get image based on type and style
app.get("/api/get-design", (req, res) => {
  const { productType, style } = req.query;
  const query =
    "SELECT image FROM design_generator WHERE type = ? AND style = ?";

  connection.query(query, [productType, style], (error, results) => {
    if (error) {
      console.error("Error fetching design:", error);
      return res.status(500).json({ error: "Failed to fetch design" });
    }
    if (results.length === 0 || !results[0].image) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Assuming results[0].image is the BLOB data
    const base64Image = results[0].image.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    res.status(200).json({ imageUrl });
  });
});

app.get("/product-liked", async (req, res) => {
  try {
    const query = "SELECT product_name, product_liked FROM products";
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching product liked data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    });
  } catch (error) {
    console.error("Error fetching product liked data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/product-seen", async (req, res) => {
  try {
    const query = "SELECT product_name, product_seen FROM products";
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching product seen data:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    });
  } catch (error) {
    console.error("Error fetching product seen data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/sales-ai", async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(order_time, '%Y-%m') AS month,
        SUM(orders.quantity * products.price * (products.product_seen + products.product_liked)) AS predicted_revenue
      FROM 
        orders
      JOIN 
        products ON orders.product_id = products.product_id
      GROUP BY 
        DATE_FORMAT(order_time, '%Y-%m')
      ORDER BY
        DATE_FORMAT(order_time, '%Y-%m');
    `;

    const monthNames = {
      "01": "Januari",
      "02": "Februari",
      "03": "Maret",
      "04": "April",
      "05": "Mei",
      "06": "Juni",
      "07": "Juli",
      "08": "Agustus",
      "09": "September",
      10: "Oktober",
      11: "November",
      12: "Desember",
    };

    connection.query(query, async (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return res.status(500).json({ error: "Failed to execute query" });
      }

      const formattedResults = results.map((row) => {
        const [year, month] = row.month.split("-");
        const monthName = monthNames[month];
        return `bulan ${monthName} ${row.predicted_revenue}`;
      });

      const salesDataText = formattedResults.join(", ");

      // Calculate the next six months
      const lastMonth = results[results.length - 1].month;
      const [lastYear, lastMonthNumber] = lastMonth.split("-");
      let year = parseInt(lastYear);
      let month = parseInt(lastMonthNumber);

      const nextSixMonths = [];
      for (let i = 0; i < 6; i++) {
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        const monthStr = month.toString().padStart(2, "0");
        const nextMonthName = monthNames[monthStr];
        nextSixMonths.push(`${nextMonthName} ${year}`);
      }

      const promptText = `Ini adalah data penjualan saya: ${salesDataText}. Berikan prediksi nominal pendapatan untuk 6 bulan ke depan.`;

      console.log("Prompt text:", promptText);

      // Kirimkan prompt text ke AI
      const aiResponse = await tanyabal(promptText);

      console.log("AI Response:", aiResponse);

      // Ekstraksi data prediksi dari AI response
      const matchedPredictionData = aiResponse.match(/(\w+): IDR ([\d,]+)/g);

      if (!matchedPredictionData) {
        return res.status(500).json({
          error: "Failed to extract prediction data from AI response",
        });
      }

      // Manipulasi data prediksi untuk format yang sesuai
      const predictions = matchedPredictionData.map((prediction, index) => {
        const [month, value] = prediction.split(": IDR ");
        const nextMonth = nextSixMonths[index];
        return {
          month: nextMonth,
          predicted_revenue: parseInt(value.replace(/,/g, "")),
        };
      });

      res.status(200).json(predictions);
    });
  } catch (error) {
    console.error("Error in sales-ai endpoint:", error);
    res.status(500).json({ error: "Error processing AI request" });
  }
});

//Endpoint data penjualan per kota
app.get('/sales-per-city', (req, res) => {
  const query = `
    SELECT
    TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.alamat, ',', -1), ' ', -1)) AS kota,
    SUM(o.quantity) AS total_terjual
    FROM
    orders o
    JOIN
    users u ON o.user_id = u.user_id
    GROUP BY
    kota
    ORDER BY
    total_terjual DESC;
    `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Results:', results); // Logging data
    res.json(results);
  });
});


// Endpoint untuk mendapatkan data total penjualan per gender
app.get('/sales-per-gender', (req, res) => {
  const query = `
    SELECT
      u.gender,
      SUM(o.quantity) AS total_terjual
    FROM
      orders o
    JOIN
      users u ON o.user_id = u.user_id
    GROUP BY
      u.gender;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    console.log('Results:', results); // Logging data
    res.json(results);
  });
});


const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
