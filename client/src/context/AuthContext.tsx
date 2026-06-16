import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type User = {
  token: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  login: (
    token: string,
    username: string
  ) => void;
  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] =
    useState<User | null>(null);

  useEffect(() => {

  const token =
    localStorage.getItem("token");

  const username =
    localStorage.getItem("username");

  if (
    token &&
    username
  ) {
    setUser({
      token,
      username,
    });
  }

}, []);

  const login = (
  token: string,
  username: string
) => {

  localStorage.setItem(
    "token",
    token
  );

  localStorage.setItem(
    "username",
    username
  );

  setUser({
    token,
    username,
  });
};

  const logout = () => {

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "username"
  );

  setUser(null);
};

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};