import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { FileUploader } from '@aws-amplify/ui-react-storage';

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  const { user, signOut } = useAuthenticator();

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }

  return (
    <main>
      <FileUploader
        acceptedFileTypes={["image/*"]}
        path="public/"
        maxFileCount={1}
        isResumable
      />
      <h1>{user?.signInDetails?.loginId}'s todos</h1>      
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map(todo => <li
          onClick={() => deleteTodo(todo.id)}
          key={todo.id}>
          {todo.content}
        </li>)}
      </ul> 
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/gen2/start/quickstart/nextjs-pages-router/">
          Review next steps of this tutorial.
        </a>
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
