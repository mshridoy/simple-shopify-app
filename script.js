module.exports = (shop) => {
  return `
    document.body.innerHTML = "${shop.value}" + document.body.innerHTML;
    `;
};
