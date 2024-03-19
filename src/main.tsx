import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Client } from './client/client';
import { ClientProvider } from './client/ClientProvider';
import './index.css'

const client = new Client();
console.log(client);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClientProvider client={client}>
      <App />
    </ClientProvider>
  </React.StrictMode>,
)
