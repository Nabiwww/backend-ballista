// Import required modules
const express = require("express");
const { tanyabal } = require("./balisai");
const connection = require("./db");
const cors = require("cors");
const { getOrderData } = require("./smallcard");
const { getOrderStats } = require("./largecard");
const { getPieChartData } = require("./piechart");
const { getOrdersData, getSalesData } = require("./linechart");
const { getDetailedOrders } = require("./table");
const categoriesRouter = require('./api/categories'); // Import router untuk categories



// Initialize Express application
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});


// Gunakan router untuk path /api/categories
app.use('/api/categories', categoriesRouter);

app.get("/orders", (req, res) => {
  getOrderData((err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      res.status(500).send("Error fetching orders");
      return;
    }
    res.json(results);
  });
});



// Endpoint to fetch detailed orders
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
      res.status(500).send("Error fetching pie chart data");
      return;
    }
    res.json(results);
  });
});

app.get("/sales-data", (req, res) => {
  getSalesData((err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      res.status(500).send("Error fetching sales data");
      return;
    }
    res.json(results);
  });
});

app.get("/orders-data-line", (req, res) => {
  getOrdersData((err, results) => {
    if (err) {
      console.error("Error fetching orders data:", err);
      res.status(500).send("Error fetching orders data");
      return;
    }
    res.json(results);
  });
});

app.get("/order-stats", (req, res) => {
  getOrderStats((err, results) => {
    if (err) {
      console.error("Error fetching order stats:", err);
      res.status(500).send("Error fetching order stats");
      return;
    }
    res.json(results);
  });
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

    // Month mapping
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

    let datasebelumya = null;

    connection.query(query, async (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        return;
      }

      // Format the results from Month mapping
      const formattedResults = results.map((row) => {
        const [year, month] = row.month.split("-");
        const monthName = monthNames[month];
        return `bulan ${monthName} ${row.total_sales}`;
      });

      // Join the formatted results into a single string
      datasebelumya = formattedResults.join(", ");
      console.log("Query results:", results);
      const tanya = `Here are my sales data: ${datasebelumya}.
1. What is the total sales for each month?
2. Compare the sales performance between months.
3. Which month has the highest and lowest sales? Format: month: highest, month: lowest.
4. Provide recommendations for products to sell in the next month. Format: Here's my recommendation for how many products to sell: [number].
5. Recommend marketing strategies suitable for selling jerseys and merchandise..`;

      console.log(tanya);

      const tanyakeai = await tanyabal(tanya);

      res.status(200).send({ msg: tanyakeai });
    });
  } catch (error) {
    console.error("Error in askAI endpoint:", error);
    res.status(500).send("Error processing AI request");
  }
});



// Start the server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
