import { useAppSelector } from '@/shared/lib/hooks';
import { Navigate, useLocation } from 'react-router-dom';

interface RedirectIfLoggedInProps {
  children: React.ReactNode;
}

export const RedirectIfLoggedIn: React.FC<RedirectIfLoggedInProps> = ({ children }) => {
  const { currentUser } = useAppSelector((state) => state.users);
  const location = useLocation();

  if (currentUser) {
    const from = location.state?.from?.pathname || '/home';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
