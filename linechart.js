const connection = require("./db");

// Fungsi untuk mengambil data sales
const getSalesData = (callback) => {
  const query = `
    SELECT 
      DATE_FORMAT(o.order_time, '%Y-%m') AS month,
      SUM(o.quantity * p.price) AS total_sales
    FROM orders o
    JOIN products p ON o.product_id = p.product_id
    GROUP BY DATE_FORMAT(o.order_time, '%Y-%m')
    ORDER BY DATE_FORMAT(o.order_time, '%Y-%m') ASC
  `;

  connection.query(query, (error, results) => {
    if (error) {
      callback(error, null);
      return;
    }
    callback(null, results);
  });
};

// Fungsi untuk mengambil data orders
const getOrdersData = (callback) => {
  const query = `
    SELECT 
      DATE_FORMAT(order_time, '%Y-%m') AS month,
      SUM(quantity) AS total_orders
    FROM orders
    GROUP BY DATE_FORMAT(order_time, '%Y-%m') 
    ORDER BY DATE_FORMAT(order_time, '%Y-%m') ASC
  `;

  connection.query(query, (error, results) => {
    if (error) {
      callback(error, null);
      return;
    }
    callback(null, results);
  });
};

module.exports = {
  getSalesData,
  getOrdersData,
};
