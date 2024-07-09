const db = require("./db");

// Fungsi untuk mendapatkan data penjualan per kota
const getSalesPerCity = (callback) => {
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

  // Jalankan query
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }

    // Gabungkan hasil query
    const salesData = results.map((row) => ({
      kota: row.kota,
      total_terjual: row.total_terjual,
    }));

    callback(null, salesData);
  });
};

module.exports = {
  getSalesPerCity,
};
