// Import required modules
const express = require("express");
const { tanyabal } = require("./balisai");
const connection = require("./db");

// Initialize Express application
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/askAI", async (req, res) => {
  try {
    const query = `SELECT 
            DATE_FORMAT(order_date, '%Y-%m') AS month,
            SUM(total_amount) AS total_sales
        FROM 
            sales
        GROUP BY 
            DATE_FORMAT(order_date, '%Y-%m');
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
      const tanya = `Berikut adalah data penjualan saya: ${datasebelumya}. 
1. Berapa total penjualan untuk setiap bulan?
2. Bandingkan kinerja penjualan antar bulan.
3. Bulan apa yang memiliki penjualan tertinggi dan terendah? Format: month: highest, month: lowest.
4. Berikan rekomendasi produk yang harus dijual pada bulan berikutnya. Format: Here's my recommendation for how many products to sell: [jumlah].
5. Berikan rekomendasi strategi marketing yang cocok untuk penjualan jersey dan merchandise.`;

      console.log(tanya);

      const tanyakeai = await tanyabal(tanya);

      res.send(tanyakeai);
    });
  } catch (error) {}
});

// Start the server
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
