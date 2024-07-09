const db = require("./db");

const getSalesPerGender = (callback) => {
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
  
    // Jalankan query
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
  
      // Gabungkan hasil query
      const salesData = results.map((row) => ({
        gender: row.gender,
        total_terjual: row.total_terjual,
      }));
  
      callback(null, salesData);
    });
  };
  
  module.exports = {
    getSalesPerGender,
  };
  