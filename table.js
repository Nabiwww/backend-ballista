// backend/table.js

const connection = require("./db"); // Import your database connection

// Function to get detailed orders with user's username, address, gender, product name, etc.
async function getDetailedOrders() {
  return new Promise((resolve, reject) => {
    const query = `
       SELECT 
        o.order_id,
        u.username,
        u.alamat,
        u.gender,
        u.email,
        p.product_name,
        o.quantity,
        o.order_time,
        o.status
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      JOIN products p ON o.product_id = p.product_id

    `;

    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

module.exports = { getDetailedOrders };
