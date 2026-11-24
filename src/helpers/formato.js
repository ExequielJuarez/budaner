// $ 46.900
const precio = (n) => "$ " + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });

// 18.500 km
const km = (n) => Number(n).toLocaleString("es-AR") + " km";

module.exports = { precio, km };
