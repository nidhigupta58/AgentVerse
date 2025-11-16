/**
 * Typed Redux Hooks
 * 
 * These are wrapper hooks around React-Redux's useDispatch and useSelector
 * that include TypeScript types. This gives us:
 * 
 * 1. Type safety - TypeScript knows what's in our store
 * 2. Autocomplete - IDE suggests available state properties
 * 3. Error prevention - Catches typos and invalid state access at compile time
 * 
 * Usage in components:
 * - const dispatch = useAppDispatch() - to dispatch actions
 * - const user = useAppSelector(state => state.users.currentUser) - to read state
 */
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

