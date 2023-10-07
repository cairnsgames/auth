import React, { createContext, useState, useEffect, useCallback } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useJwt } from "react-jwt";
import { useLogger } from "@cairnsgames/ui-components";
import { useTenant } from "@cairnsgames/tenant";

import 'dotenv/config';

type AuthType = {
  token?: string;
  login: Function;
  logout: Function;
  forgot: Function;
  user: any;
  setgoogleAccessToken: Function;
  changePassword: Function;
};
type AuthProviderType = {
  googleClientId: string;
  children: React.ReactNode;
};
const defaultAuth: AuthType = {
  token: "",
  login: () => {},
  logout: () => {},
  forgot: () => {},
  user: {},
  setgoogleAccessToken: () => {},
  changePassword: () => {},
};
interface googleDecodedToken {
  email: string;
  family_name: string;
  given_name: string;
  sub: string;
  name: string;
  picture: string;
  verified_email: string;
}

// create context
const AuthenticationContext = createContext<AuthType>(defaultAuth);

/**
 * This is a React component that provides authentication functionality using Google OAuth and a custom
 * login system.
 * @param props - An object containing the properties passed to the AuthenticationProvider component.
 * @returns The component `AuthenticationProvider` is being returned.
 */
const AuthenticationProvider = (props: AuthProviderType) => {
  const { children, googleClientId } = props;
  const [token, settoken] = useState<string>();
  const [googleAccessToken, setgoogleAccessToken] = useState<string>();
  const [user, setUser] = useState<any>();
  const { decodedToken } = useJwt(googleAccessToken || ""); // What about isExpired
  const { logger } = useLogger("Auth");

  const { tenant } = useTenant();

  
  logger.log("process.env", process.env)
  logger.log("APPLICATION ID For Auth", tenant);
  logger.log("google ClinetId", googleClientId);

  useEffect(() => {
    logger.log("Auth Tenant", tenant);
  }, [tenant]);

  useEffect(() => {
    logger.log("USER DETAILS CHANGED", user);
  }, [user]);

  useEffect(() => {
    logger.log("TOKEN CHANGED", token);
    if (token) {
      localStorage.setItem("cg." + tenant + ".auth", token);
    }
  }, [token]);

  useEffect(() => {
    if (!process.env) {
      return;
    }
    logger.log("Process or Tenant Change");
    const savedToken = localStorage.getItem("cg." + tenant + ".auth");
    if (savedToken && savedToken !== "undefined") {
      // Validate Token
      const body = { token: savedToken };
      logger.log("ValidateToken env", process.env.REACT_APP_AUTH_API);
      fetch(process.env.REACT_APP_AUTH_API + "validateToken.php?debug=true", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", APP_ID: tenant },
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data === "string") {
            data = JSON.parse(data);
          }
          if (data.errors) {
            logger.error("VALIDATE TOKEN ERRORS", data.errors);
          }
          settoken(data.token);
          const userDetails = {
            email: data.email,
            family_name: data.lastname,
            given_name: data.firstname,
            id: data.id,
            name: data.firstname + " " + data.lastname,
            picture: data.avatar,
          };
          setUser(userDetails);
          logger.log("REMEMBER ME", userDetails);
          if (window.location.hash.includes("auth")) {
            window.location.hash = "#";
          }
        });
      settoken(savedToken);
    }
  }, [process, tenant]);

  const getGoogleUser = useCallback(async () => {
    if (googleAccessToken && decodedToken) {
      const decodedToken2 = decodedToken as googleDecodedToken;
      logger.log("GOOGLE ACCESS TOKEN", decodedToken);
      setUser({
        email: decodedToken2.email,
        family_name: decodedToken2.family_name,
        given_name: decodedToken2.given_name,
        id: decodedToken2.sub,
        name: decodedToken2.name,
        avatar: decodedToken2.picture,
        verified_email: decodedToken2.verified_email,
      });
      const body = {
        email: decodedToken2.email,
        firstname: decodedToken2.given_name,
        lastname: decodedToken2.family_name,
        googleid: decodedToken2.sub,
        avatar: decodedToken2.picture,
      };
      await fetch(process.env.REACT_APP_AUTH_API + "/logingoogle.php", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", APP_ID: tenant },
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          logger.log("GOOGLE LOGIN", data);
          settoken(data.token);
          window.location.hash = "#";
        });
    }
  }, [googleAccessToken, decodedToken]);

  useEffect(() => {
    if (googleAccessToken) {
      getGoogleUser();
    }
  }, [googleAccessToken, getGoogleUser]);

  const logout = () => {
    logger.log("Logout");
    setgoogleAccessToken(undefined);
    setUser(undefined);
    settoken(undefined);
    location.hash = "#";
    localStorage.removeItem("cg." + tenant + ".auth");
  };

  const login = async (email: string, password: string) => {
    logger.log("Login");
    const body = {
      email: email,
      password: password,
    };
    logger.log("process.env", process.env);
    logger.log("APP_ID", tenant);
    return fetch(process.env.REACT_APP_AUTH_API + "/login.php?debug=true", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", APP_ID: tenant },
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        logger.log("LOGIN DATA", data);
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        settoken(data.token);
        const userDetails = {
          email: data.email,
          family_name: data.lastname,
          given_name: data.firstname,
          id: data.id,
          name: data.firstname + " " + data.lastname,
          picture: data.avatar,
        };
        logger.log("LOGIN", userDetails);
        setUser(userDetails);
        return data;
      });
  };

  const forgot = async (email: string) => {
    logger.log("forgot", email);
    const body = {
      email: email,
    };
    logger.log("process.env.REACT_APP_AUTH_API", process);
    return fetch(
      process.env.REACT_APP_AUTH_API + "/forgotpassword.php?debug=true",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", APP_ID: tenant },
        method: "POST",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        logger.log("FORGOT PASSWORD DATA", data);
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        logger.log("Forgot password response)  ", data);
        return data;
      });
  };

  const changePassword = (
    id: string,
    old: string,
    password: string,
    password2: string
  ) => {
    logger.log("change password", id, old, password, password2);
    const body = {
      userid: id,
      oldpassword: old,
      password: password,
      password2: password2,
    };
    logger.log("process.env.REACT_APP_AUTH_API", process);
    return fetch(
      process.env.REACT_APP_AUTH_API + "/changepassword.php?debug=true",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", APP_ID: tenant },
        method: "POST",
      }
    );
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthenticationContext.Provider
        value={{
          token,
          login,
          logout,
          forgot,
          user,
          setgoogleAccessToken,
          changePassword,
        }}
      >
        {children}
      </AuthenticationContext.Provider>
    </GoogleOAuthProvider>
  );
};

export { AuthenticationContext, AuthenticationProvider };
export default AuthenticationProvider;
