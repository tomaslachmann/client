import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useClient } from './client/useClient';
import { useClients } from './client/useClients';

async function test(test: string) {
  await new Promise((res) => setTimeout(res, 1000));
	return test;
}

async function test1(test: string) {
  setTimeout(() => {
    throw new Error(test);
  }, 1000);
}

/* async function testWithArgs(args: string) {
  return Promise.resolve(args);
} */

function App() {
  const [count, _setCount] = useState(0);
  const client1 = useClient({ queryKey: ['test-fn', 'ahoj.'], queryFn: test, options: { fetchOnMount: true  } });
  const client2 = useClient({ queryKey: ['test-fn', 'ahoj-1'], queryFn: test, options: { fetchOnMount: true  } });
/*   const client3 = useClients({
    clients: [
    { queryKey: ['test-fn', 'ahoj-1'], queryFn: test },
    { queryKey: ['test-fn', 'ahoj-3'], queryFn: test },
    ],
  });

  console.log(client3);
 */
  return (
    <>
    {
      client1.isLoading && 'loading...'
    }
    {
      client1.isFetching && 'fetching...'
    }
    {
      client1.isSuccess && <div>success!</div>
    }
    {
      client1.data && <div>{client1.data}</div>
    }
        {
      client2.isLoading && 'loading...'
    }
    {
      client2.isFetching && 'fetching...'
    }
    {
      client2.isSuccess && <div>success!</div>
    }
    {
      client2.data && <div>{client2.data}</div>
    }
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
