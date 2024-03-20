import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useQuery } from './client/hooks/useQuery';
import { useClient } from './client/ClientProvider';
import { useQueries } from './client/useQueries';

async function test(test: number) {
  await new Promise((res) => setTimeout(res, 1000));
	return test;
}

async function test1() {
  await new Promise((res) => setTimeout(res, 1000));
	return 'test';
}

async function testFetch() {
  const res = await fetch('https://youtube.com');
  console.log(res);
}

/* async function testWithArgs(args: string) {
  return Promise.resolve(args);
} */

function App() {
  const [count, setCount] = useState(0);
  const client1 = useQuery({ queryKey: ['test-fn', count], queryFn: test, options: { fetchOnMount: true, refetchInterval: 1000 * 5, backgroundRefetch: true  } });
  const client2 = useQueries({
    queries: new Array(4).map((_, i) => ({
      queryFn: test,
      queryKey: ['test-fn-bulk', i]
    }))
  })
  
  console.log(client1);
  console.log(client2);
/*   const client = useClient();
  const asd = client.fetch({
    queryFn: test1,
    queryKey: 'test-no-args',
  })
  console.log(asd);
  console.log(client.getQuery('test-no-args')); */
  //const client2 = useClient({ queryKey: ['test-fn', 'ahoj-1'], queryFn: test, options: { fetchOnMount: true  } });
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
      client1.isError && <div>Error!</div>
    }
    {
      client1.error && <div>{JSON.stringify(client1.error)}</div>
    }
    {
      client1.data && <div>{client1.data}</div>
    }
 {/*        {
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
    } */}
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
        <button onClick={() => setCount(oldCount => oldCount + 1)}>
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
