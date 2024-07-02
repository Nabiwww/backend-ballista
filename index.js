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

app.post("/api/products", (req, res) => {
  const { product_name, product_id, description, price, image_url } = req.body;

  const query =
    "INSERT INTO products (product_id, product_name, description, price, image) VALUES (?, ?, ?, ?, ?)";
  const values = [product_id, product_name, description, price, image_url];

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
Berapa total penjualan untuk setiap bulan?
Bandingkan kinerja penjualan antara bulan.
Bulan mana yang memiliki penjualan tertinggi dan terendah? Format: bulan: tertinggi, bulan: terendah.
Berikan rekomendasi produk untuk dijual bulan depan. Format: Inilah rekomendasi saya untuk jumlah produk yang harus dijual: [jumlah].
Rekomendasikan strategi pemasaran yang sesuai untuk menjual jersey dan merchandise.`;

      console.log("Prompt text:", promptText);

      const aiResponse = await tanyabal(promptText);

      res.status(200).json({ aiResponse });
    });
  } catch (error) {
    console.error("Error in askAI endpoint:", error);
    res.status(500).json({ error: "Error processing AI request" });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
