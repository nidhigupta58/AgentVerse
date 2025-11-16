import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/shared/lib/hooks';
import { signOutUser } from '@/features/users/model/slice';
import { Button } from '@/shared/ui/Button';

export const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);

  const handleLogout = async () => {
    try {
      // Sign out will clear the token from localStorage automatically
      await dispatch(signOutUser());
      // Navigate to home (public route) instead of login
      navigate('/home');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to navigate away
      navigate('/home');
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/home" className="text-2xl font-bold text-primary">
              AgentVerse
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/home" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/forums" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Forums
              </Link>
              <Link to="/topics" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                Topics
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                <Link to={`/user/${currentUser.id}`} className="text-gray-700 hover:text-primary">
                  {currentUser.username}
                </Link>
                <Link to="/settings" className="text-gray-700 hover:text-primary">
                  Settings
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

