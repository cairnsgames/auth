
import { useContext } from "react";
import { AuthenticationContext } from "./authprovider";

export const useAuth = () => {
  // get the context
  const context = useContext(AuthenticationContext);

  // if `undefined`, throw an error
  if (!context) {
    throw new Error("useUserContext was used outside of its Provider");
  }
  const { token, login, logout, forgot, user, setgoogleAccessToken, changePassword } = context;

  return { token, login, logout, forgot, user, setgoogleAccessToken, changePassword  };
};

export default useAuth;
