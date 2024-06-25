const db = require("./db");

// Fungsi untuk mendapatkan data order dari tabel orders
const getOrderData = (callback) => {
  const queryOrders = `
    SELECT 
      SUM(quantity) AS total,
      SUM(CASE WHEN status = 'failed' THEN quantity ELSE 0 END) AS failed,
      SUM(CASE WHEN status = 'process' THEN quantity ELSE 0 END) AS processing,
      SUM(CASE WHEN status = 'completed' THEN quantity ELSE 0 END) AS delivered
    FROM orders;
  `;

  // Jalankan query
  db.query(queryOrders, (err, results) => {
    if (err) {
      return callback(err, null);
    }

    // Gabungkan hasil query
    const orderData = {
      total: results[0].total,
      failed: results[0].failed,
      processing: results[0].processing,
      delivered: results[0].delivered,
    };

    callback(null, orderData);
  });
};

module.exports = {
  getOrderData,
};
