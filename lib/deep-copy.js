const deepCopy = (object) => {
  if (typeof object !== Object) return object;
  return JSON.parse(JSON.stringify(object));
};

module.exports = deepCopy;
