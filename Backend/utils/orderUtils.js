
const generateOrderNumber = () => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${randPart}`;
};

module.exports = { generateOrderNumber };
