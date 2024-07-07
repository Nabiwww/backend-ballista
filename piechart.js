const connection = require("./db");

const getPieChartData = (callback) => {
  const query = `
  SELECT p.product_name, SUM(o.quantity) AS total_sales
  FROM orders o
  JOIN products p ON o.product_id = p.product_id
  GROUP BY p.product_name
  ORDER BY total_sales DESC
  LIMIT 4;
  `
  ;

  connection.query(query, (error, results) => {
    if (error) {
      callback(error, null);
      return;
    }

    callback(null, results);
  });
};

module.exports = {
  getPieChartData,
};