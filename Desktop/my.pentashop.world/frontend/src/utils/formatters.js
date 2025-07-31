// Utility functions to prevent NaN values in formatting

export const formatCurrency = (amount) => {
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '€0,00';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if conversion was successful
  if (isNaN(numAmount)) {
    return '€0,00';
  }
  
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(numAmount);
};

export const formatPercentage = (rate) => {
  // Handle undefined, null, or NaN values
  if (rate === undefined || rate === null || isNaN(rate)) {
    return '0,0%';
  }
  
  // Convert to number if it's a string
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  
  // Check if conversion was successful
  if (isNaN(numRate)) {
    return '0,0%';
  }
  
  return `${(numRate * 100).toFixed(1)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  // Handle undefined, null, or NaN values
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if conversion was successful
  if (isNaN(numValue)) {
    return '0';
  }
  
  return numValue.toFixed(decimals);
};

export const safeReduce = (array, callback, initialValue = 0) => {
  if (!Array.isArray(array)) {
    return initialValue;
  }
  
  return array.reduce((sum, item) => {
    const value = callback(item);
    return sum + (isNaN(value) ? 0 : value);
  }, initialValue);
};

export const safeCalculate = (value1, value2, operation = 'add') => {
  const num1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const num2 = typeof value2 === 'string' ? parseFloat(value2) : value2;
  
  if (isNaN(num1) || isNaN(num2)) {
    return 0;
  }
  
  switch (operation) {
    case 'add':
      return num1 + num2;
    case 'subtract':
      return num1 - num2;
    case 'multiply':
      return num1 * num2;
    case 'divide':
      return num2 !== 0 ? num1 / num2 : 0;
    default:
      return num1 + num2;
  }
}; 