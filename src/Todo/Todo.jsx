import React, { useState, useEffect, useRef } from 'react';
import { Empty, Task } from './helloworld_pb';
import { GreeterClient } from './helloworld_grpc_web_pb';
import { v4 as uuid } from 'uuid';

const Todo = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(false);
  const taskRef = useRef();

  const client = new GreeterClient(
    'http://' + window.location.hostname + ':8080',
    null,
    null,
  );

  useEffect(() => {
    taskRef.current.focus();
    getTasks();
  }, []);

  function getTasks() {
    const request = new Empty();

    client.listTasks(request, {}, (err, response) => {
      if (err) {
        setError(true);
        return console.log(err);
      }

      response = response.toObject().tasksList.map(task => task);
      setTasks([...tasks, ...response]);
    });
  }

  function addTask(uuid, message) {
    if (error) {
      setError(false);
    }
    setTasks([...tasks, { uuid, message, pending: true }]);

    const request = new Task();
    request.setUuid(uuid);
    request.setMessage(message);

    client.newTask(request, {}, err => {
      if (err) {
        setError(true);
        console.log(err);

        removeTaskFromState(uuid);
      }
      removePending(uuid);
    });
  }

  function removeTask(uuid) {
    removeTaskFromState(uuid);
  }

  function removePending(uuid) {
    setTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.uuid === uuid) {
          delete task.pending;
        }
        return task;
      }),
    );
  }

  function removeTaskFromState(uuid) {
    setTasks(currentTasks => currentTasks.filter(task => task.uuid !== uuid));
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="p-2 my-2 bg-grey rounded">
        <ul className="list-reset">
          {tasks.map(task => (
            <Tasks key={task.uuid} task={task} removeTask={removeTask} />
          ))}
        </ul>
        <TodoForm addTask={addTask} taskRef={taskRef} />
        {error && (
          <div className="mt-3 px-1">Error: Can't connect to database</div>
        )}
      </div>
    </div>
  );
};

const Tasks = ({ task, removeTask }) => {
  let isPending = 'flex justify-between bg-grey-light mb-2 rounded';
  if (task.pending) isPending += ' text-grey-dark';
  return (
    <li className={isPending}>
      <div className="p-2">{task.message}</div>
      <div>
        <button
          className="bg-red text-white p-2 px-3 rounded-tr rounded-br"
          onClick={() => removeTask(task.uuid)}
        >
          X
        </button>
      </div>
    </li>
  );
};

const TodoForm = ({ addTask, taskRef }) => {
  const handleSumbit = e => {
    const message = taskRef.current.value;
    e.preventDefault();
    if (!message) return;
    addTask(uuid(), message);
    taskRef.current.value = null;
  };

  return (
    <form onSubmit={handleSumbit}>
      <input
        className="w-full bg-grey-light rounded p-2"
        placeholder="Add new task..."
        ref={taskRef}
      />
    </form>
  );
};

export default Todo;
