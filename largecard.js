const db = require("./db");

// Fungsi untuk mendapatkan data penjualan dari tabel orders dan products serta tabel sales
const getOrderStats = (callback) => {
  // Query untuk mendapatkan data penjualan dari tabel orders dan products
  const queryOrders = `
    SELECT 
      SUM(CASE WHEN MONTH(order_time) = MONTH(CURDATE()) - 1 AND YEAR(order_time) = YEAR(CURDATE()) THEN o.quantity * p.price ELSE 0 END) AS last_month_sales,
      SUM(o.quantity * p.price) AS total_sales
    FROM orders o
    JOIN products p ON o.product_id = p.product_id;
  `;

  // Query untuk mendapatkan data penjualan dari tabel sales
  const querySales = `
    SELECT 
      SUM(CASE WHEN DATE(order_date) = CURDATE() THEN total_amount ELSE 0 END) AS today_sales,
      SUM(CASE WHEN DATE(order_date) = CURDATE() - INTERVAL 1 DAY THEN total_amount ELSE 0 END) AS yesterday_sales
    FROM sales;
  `;

  // Jalankan kedua query secara paralel
  db.query(queryOrders, (errOrders, resultsOrders) => {
    if (errOrders) {
      return callback(errOrders, null);
    }

    db.query(querySales, (errSales, resultsSales) => {
      if (errSales) {
        return callback(errSales, null);
      }

      // Gabungkan hasil query
      const orderStats = {
        today_sales: resultsSales[0].today_sales,
        yesterday_sales: resultsSales[0].yesterday_sales,
        last_month_sales: resultsOrders[0].last_month_sales,
        total_sales: resultsOrders[0].total_sales,
      };

      callback(null, orderStats);
    });
  });
};

module.exports = {
  getOrderStats,
};
