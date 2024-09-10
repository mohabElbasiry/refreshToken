const fs = require("fs");
const path = require("path");

// Fetch-related code content
const fetchCode = `
import { configureRefreshFetch, fetchJSON } from "refresh-fetch";
import merge from "lodash/merge";
// Use same as the original fetch
// refreshFetch("/api-with-authentication", { method: "POST" });
const retrieveToken = () => {
 return localStorage.getItem("accessToken");
};
const fetchJSONWithToken = (url, options = {}) => {
 const token = retrieveToken();
 let optionsWithToken = options;
 if (token != null) {
   optionsWithToken = merge({}, options, {
     headers: {
       Authorization: \`Bearer \${token}\`,
     },
   });
 }
 return fetchJSON(url, optionsWithToken);
};
const saveToken = (body) => {
 console.log(body.accessToken, body.refreshToken);
 localStorage.setItem("accessToken", body.accessToken);
 localStorage.setItem("refreshToken", body.refreshToken);
};
const shouldRefreshToken = (error) => {
 console.log(error, error.response.status === 500 && error.body.message === "jwt expired");
 return error.response.status === 500 && error.body.message === "jwt expired";
};
const clearToken = () => {
 localStorage.removeItem("accessToken");
 localStorage.removeItem("refreshToken");
};
const refreshToken = async () => {
 const refreshToken = localStorage.getItem("refreshToken");
 return fetchJSONWithToken(
   "http://localhost:3001/api/v1/users/refresh-token",
   {
     method: "POST",
     body: JSON.stringify({ refreshToken }),
   }
 )
   .then((response) => {
     console.log(response, "Token refreshed successfully");
     saveToken(response.body);
   })
   .catch((error) => {
     console.log(error, "Error refreshing token");
     throw error;
   });
};
const fetch = configureRefreshFetch({
 fetch: fetchJSONWithToken,
 shouldRefreshToken,
 refreshToken,
});

export { fetch };
`;
// Axios-related code content
const axiosCode = `
import { axiosPrivate } from "../axios";
import { useEffect } from "react";
import useAuth from "./auth";
import useRefreshToken from "./useRefreshToken";

const useAxiosPrivate = () => {
  const refresh = useRefreshToken();
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = \`Bearer \${accessToken}\`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        console.log(error);
        if (
          error?.response?.data?.message === "jwt expired" &&
          !prevRequest?.sent
        ) {
          prevRequest.sent = true;
          const newAccessToken = await refresh();
          console.log(newAccessToken, "newAccessToken");
          prevRequest.headers["Authorization"] = \`Bearer \${newAccessToken}\`;
          return axiosPrivate(prevRequest);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken, refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;

`;
const AxiosSetup = `import axios from "axios";
const BASE_URL = "http://localhost:3001/api/v1/users";

export default axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials:true
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
;`;
const ProtectedRouteContent = `import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({ allowedRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    return (
        auth?.roles?.find(role => allowedRoles?.includes(role))
            ? <Outlet />
            : auth?.user
                ? <Navigate to="/unauthorized" state={{ from: location }} replace />
                : <Navigate to="/login" state={{ from: location }} replace />
    );
}

export default RequireAuth;`;
// Function to create a file with content

const NormalFetchMethod = `export const fetchUser = async ({ payload }) => {
  try {
    const data = await fetch("http://localhost:3001/api/v1/users/login", {
      headers: {
        "Content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(payload),

      method: "POST",
    });
    const res = await data.json();
    console.log('objectdassssssssssssssssss',res)
    if (res?.ok) {
      return res;
    }
    return res;
  } catch (err) {

  console.log(err,'adsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsdsds')
    return err;
  }
};
`;
const AuthProvider = `import { createContext, useState } from "react";
//    const { setAuth } = useContext(AuthContext);

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
`;
const useRefreshTokenContent = ` import axios from '.';
import useAuth from './auth';
 
const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        const response = await axios.post('/refresh-token', {
            withCredentials: true
        });
        console.log(response,'responsadssssssse')
        setAuth(prev => {
            console.log(JSON.stringify(prev));
            console.log(response.data.accessToken);
            return { ...prev, accessToken: response.data.accessToken }
        });
        return response.data.accessToken;
    }
    return refresh;
};

export default useRefreshToken;
`;

const ReadMe = `
//instllation  refresh-fetch axios

//implementation example
// useEffect(() => {
    // (async () => {
    //   try {
    //     const login = await fetchUser({
    //       payload: {
    //         email: "nawaz@gmail.com",
    //         password: "12345",
    //       },
    //     });
    //     const data = await login;
    //     const { accessToken, refreshToken } = data;
    //     console.log(data,'adssssssssssssssss')
    //     localStorage.setItem("accessToken", accessToken);
    //     localStorage.setItem("refreshToken", refreshToken);
    //   } catch (error) {}
    // })();
    //       fetch('http://localhost:3001/api/v1/users/logout',{
    //       method:"POST"
    //     }).then(res=>{
    //       console.log(localStorage.getItem("accessToken"));
    // console.log(res,'adsssssssssssssss')
    //     }).catch(err=>{
    //       console.log(localStorage.getItem("accessToken"),'dassssssssssss');
    //       console.log(err,'asdddddddddddddddddddddddddddd')})
  // }, []);
  // useEffect(() => {
    // axios
    //   .post(
    //     "/login",
    //     JSON.stringify({ email: "nawaz@gmail.com", password: "12345" }),
    //     {
    //       headers: { "Content-Type": "application/json" },
    //       withCredentials: true,
    //     }
    //   )
    //   .then((res) => {
    //     localStorage.setItem("accessToken", res?.data?.accessToken);

    //     console.log(res);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  //   axiosPrivate
  //     .post("/logout", {
  //       headers: { "Content-Type": "application/json" },
  //       withCredentials: true,
  //     })
  //     .then((res) => {
  //       console.log(res);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // }, []);

`;
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content, { flag: "w" });
  console.log(`File created at: ${filePath}`);
}

// Dynamic function to create folders and files based on a structure
function createApi(folderName = "api", structure = {}) {
  const apiDir = path.join(__dirname, "src", folderName);

  // Recursively create folders and files based on the structure
  function createFoldersAndFiles(baseDir, structure) {
    Object.keys(structure).forEach((key) => {
      const currentPath = path.join(baseDir, key);

      // If the value is an object, treat it as a directory
      if (typeof structure[key] === "object") {
        if (!fs.existsSync(currentPath)) {
          fs.mkdirSync(currentPath, { recursive: true });
          console.log(`Directory created: ${currentPath}`);
        }
        // Recursively create subfolders and files
        createFoldersAndFiles(currentPath, structure[key]);
      } else {
        // If the value is a string, treat it as file content
        createFile(currentPath, structure[key]);
      }
    });
  }

  // Call the recursive function to create the structure
  createFoldersAndFiles(apiDir, structure);
}

// Example structure object for creating dynamic folders and files
const apiStructure = {
  fetch: {
    "operationServer.js": `${fetchCode}`,
    "fetch.js": `${NormalFetchMethod}`,
  },
  axios: {
    "index.js": `${AxiosSetup}`,
    "refreshaxios.js": `${axiosCode}`,
    "useRefreshToken.js": `${useRefreshTokenContent}`,
  },
  ProtectedRoute: {
    "index.js": `${ProtectedRouteContent}`,
  },
  context: {
    "AuthProvider.js": `${AuthProvider}`,
  },
  readMe: {
    "readme.md": `${ReadMe}`,
  },
};

// Call the createApi function with dynamic structure
const [, , apiCommand] = process.argv;
if (apiCommand === "refreshtoken") {
  createApi("api", apiStructure);
}
