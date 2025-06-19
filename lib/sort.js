const sortByTitle = (itemA, itemB) => {
  let titleA = itemA.title.toLowerCase();
  let titleB = itemB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

const sortItems = (undone, done) => {
  undone.sort(sortByTitle);
  done.sort(sortByTitle);
  return [].concat(undone, done);
};

module.exports = {
  sortTodoLists: sortItems,
  sortTodos: sortItems,
};
