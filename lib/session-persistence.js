const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists, sortTodos } = require("./sort.js");
const nextId = require("./next-id.js");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  isDoneTodoList(todoList) {
    return (
      todoList.todos.length > 0 && todoList.todos.every((todo) => todo.done)
    );
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some((todo) => !todo.done);
  }

  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter((todoList) => !this.isDoneTodoList(todoList));
    let done = todoLists.filter((todoList) => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter((todo) => !todo.done);
    let done = todos.filter((todo) => todo.done);

    return deepCopy(sortTodos(undone, done));
  }

  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;
    return deepCopy(todoList);
  }

  loadTodo(todoId, todoListId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
  }

  toggleDoneTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if (!todo) return false;

    todo.done = !todo.done;
    return true;
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    return todoList.todos.find((todo) => todo.id === todoId);
  }

  _findTodoList(todoListId) {
    return this._todoLists.find((todoList) => todoList.id === todoListId);
  }

  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    let todoIndex = todoList.todos.findIndex((todo) => todo.id === todoId);
    if (todoIndex === -1) return false;

    todoList.todos.splice(todoIndex, 1);
    return true;
  }

  deleteTodoList(todoListId) {
    let todoListIndex = this._todoLists.findIndex(
      (todoList) => todoList.id === todoListId
    );
    if (todoListIndex === -1) return false;

    this._todoLists.splice(todoListIndex, 1);
    return true;
  }

  markAllDone(todoList) {
    todoList.todos.map((todo) => (todo.done = true));
    return true;
  }

  getTodoTitle(todoListId, todoId) {
    let todo = this._findTodo(+todoListId, +todoId);
    if (!todo) return undefined;
    console.log(todo);
    return todo.title;
  }

  createNewTodo(todoListId, title) {
    let todoList = this._findTodoList(+todoListId);
    if (!todoList) return false;

    todoList.todos.push({
      id: nextId(),
      title,
      done: false,
    });
    return true;
  }

  setTodoListTitle(todoListId, title) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    todoList.title = title;
    return true;
  }

  existsTodoListTitle(title) {
    const titleExists = this._todoLists.find(
      (todoList) => todoList.title === title
    );
    return titleExists;
  }

  createTodoList(title) {
    const newTodoList = {
      id: nextId(),
      title,
      todos: [],
    };
    this._todoLists.push(newTodoList);
    return true;
  }

  isUniqueConstraintViolation(_error) {
    // checks whether the error passed is a "unique constraint violation" or not
    return false;
  }
};
