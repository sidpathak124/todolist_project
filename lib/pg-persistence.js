const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  hasUndoneTodos(todoList) {
    return todoList.todos.some((todo) => !todo.done);
  }

  async sortedTodoLists() {
    const ALL_TODOLISTS =
      "SELECT * FROM todolists WHERE username = $1 ORDER BY LOWER(title) ASC";
    const ALL_TODOS = "SELECT * FROM todos WHERE username = $1";

    let resultTodolists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(ALL_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodolists, resultTodos]);

    let allTodolists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;
    if (!allTodolists || !allTodos) return undefined;

    allTodolists.forEach((todoList) => {
      todoList.todos = allTodos.filter((todo) => {
        return todo.todolist_id === todoList.id;
      });
    });

    return this._partitionTodolists(allTodolists);
  }

  _partitionTodolists(todoLists) {
    let done = [];
    let undone = [];

    todoLists.forEach((todoList) => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });
    return undone.concat(done);
  }

  isDoneTodoList(todoList) {
    return (
      todoList.todos.length > 0 && todoList.todos.every((todo) => todo.done)
    );
  }

  async sortedTodos(todoList) {
    const FIND_TODOS =
      "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2 ORDER BY done, LOWER(title)";
    const result = await dbQuery(FIND_TODOS, todoList.id, this.username);
    const todos = result.rows;

    return todos;
  }

  async loadTodoList(todoListId) {
    const FIND_TODOLIST =
      "SELECT * FROM todolists WHERE id = $1 AND username = $2";
    const FIND_TODOS =
      "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2";

    const result_todolist = dbQuery(FIND_TODOLIST, todoListId, this.username);
    const result_todos = dbQuery(FIND_TODOS, todoListId, this.username);
    const resultBoth = await Promise.all([result_todolist, result_todos]);

    let todolist = resultBoth[0].rows[0];
    if (!todolist) return undefined;

    todolist.todos = resultBoth[1].rows;
    return todolist;
  }

  async loadTodo(todoId, todoListId) {
    const FIND_TODO =
      "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";
    const result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    console.log(result);
    return result.rows[0];
  }

  async toggleDoneTodo(todoListId, todoId) {
    const TOGGLE_DONE =
      "UPDATE todos SET done = NOT done WHERE todolist_id = $1 AND id = $2 AND username = $3";

    const result = await dbQuery(
      TOGGLE_DONE,
      todoListId,
      todoId,
      this.username
    );
    return result.rowCount > 0;
  }

  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO =
      "DELETE FROM todos WHERE todolist_id = $1 AND id = $2 AND username = $3";
    const result = await dbQuery(
      DELETE_TODO,
      todoListId,
      todoId,
      this.username
    );
    return result.rowCount > 0;
  }

  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST =
      "DELETE FROM todolists WHERE id = $1 AND username = $2";
    const result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  async completeAllTodo(todoListId) {
    const COMPLETE_ALL =
      "UPDATE todos SET done = TRUE WHERE todolist_id = $1 AND NOT done AND username = $2";
    const result = await dbQuery(COMPLETE_ALL, todoListId, this.username);

    return result.rowCount > 0;
  }

  markAllDone(todoList) {
    todoList.todos.map((todo) => (todo.done = true));
    return true;
  }

  async getTodoTitle(todoListId, todoId) {
    const FIND_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2";
    const result = await dbQuery(FIND_TODO, todoListId, todoId);
    let todo = result.rowCount[0];
    return todo.title;
  }

  async createNewTodo(todoListId, title) {
    const ADD_TODO =
      "INSERT INTO todos (title, todolist_id, username) VALUES ($1, $2, $3)";
    const result = await dbQuery(ADD_TODO, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  async setTodoListTitle(todoListId, title) {
    const SET_TITLE =
      "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";
    const result = await dbQuery(SET_TITLE, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  existsTodoListTitle(title) {
    const FIND_TODOLIST =
      "SELECT NULL FROM todolists WHERE title = $1 AND username = $2";
    const result = dbQuery(FIND_TODOLIST, title, this.username);
    return result.rowCount > 0;
  }

  async createTodoList(title) {
    try {
      const ADD_TODOLIST =
        "INSERT INTO todolists (title, username) VALUES ($1, $2)";
      const result = await dbQuery(ADD_TODOLIST, title, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async authenticate(username, password) {
    // password = bcrypt(password, 10, (_, hash) => hash);
    const FIND_HASHED_PASSWORD =
      "SELECT password FROM users WHERE username = $1";

    const result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;
    return bcrypt.compare(password, result.rows[0].password);
  }
};
