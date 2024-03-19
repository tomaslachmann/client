import { useContext } from 'react';
import { ClientContext } from '../ClientProvider';

export function useApiClient() {
  return useContext(ClientContext).apiClient;
}