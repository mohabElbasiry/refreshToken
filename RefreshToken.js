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
const nextMiddleware =
  `import { NextResponse } from "next/server";

import { cookies } from "next/headers";

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  const token = cookies().get("token")?.value;

  const role = cookies().get("role")?.value;

  if (pathname.includes("login") || pathname?.includes("signup")) {
    if (token && token !== "" && role && role === "user") {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
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

const formValidation = `
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";

import googleIcon from "@/public/images/auth/google.png";
import facebook from "@/public/images/auth/facebook.png";
import twitter from "@/public/images/auth/twitter.png";
import GithubIcon from "@/public/images/auth/github.png";

const schema = z.object({
  email: z.string().email({ message: "Your email is invalid." }),
  password: z.string().min(4),
});
import { useMediaQuery } from "@/hooks/use-media-query";

const LogInForm = () => {
  const [isPending, startTransition] = React.useTransition();
  const [passwordType, setPasswordType] = React.useState("password");
  const isDesktop2xl = useMediaQuery("(max-width: 1530px)");

  const togglePasswordType = () => {
    setPasswordType((prevType) =>
      prevType === "text" ? "password" : "text"
    );
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      email: "dashtail@codeshaper.net",
      password: "password",
    },
  });

  const onSubmit = (data) => {
    startTransition(async () => {
      let response = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (response?.ok) {
        toast.success("Login Successful");
        window.location.assign("/dashboard");
        reset();
      } else if (response?.error) {
        toast.error(response?.error);
      }
    });
  };

  return (
    <div className="w-full py-10">
      <Link href="/dashboard" className="inline-block">
        <div className="h-10 w-10 2xl:w-14 2xl:h-14 bg-primary" />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Hey, Hello 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 2xl:mt-2 leading-6">
        Enter the information you entered while registering.
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 2xl:mt-7">
        <div>
          <label htmlFor="email" className="mb-2 font-medium text-default-600">
            Email
          </label>
          <input
            disabled={isPending}
            {...register("email")}
            type="email"
            id="email"
            className={\`w-full px-3 py-2 border \${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent\`}
            size={!isDesktop2xl ? "xl" : "lg"}
          />
        </div>
        {errors.email && (
          <div className="text-red-500 mt-2">{errors.email.message}</div>
        )}

        <div className="mt-3.5">
          <label htmlFor="password" className="mb-2 font-medium text-default-600">
            Password
          </label>
          <div className="relative">
            <input
              disabled={isPending}
              {...register("password")}
              type={passwordType}
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              size={!isDesktop2xl ? "xl" : "lg"}
              placeholder=" "
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 right-4 cursor-pointer"
              onClick={togglePasswordType}
            >
              {passwordType === "password" ? (
                <Icon icon="heroicons:eye" className="w-5 h-5 text-gray-400" />
              ) : (
                <Icon icon="heroicons:eye-slash" className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        {errors.password && (
          <div className="text-red-500 mt-2">{errors.password.message}</div>
        )}

        <div className="mt-5 mb-8 flex flex-wrap gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <input
              type="checkbox"
              className="border-gray-300 mt-[1px]"
              id="isRemembered"
            />
            <label htmlFor="isRemembered" className="text-sm text-default-600 cursor-pointer">
              Remember me
            </label>
          </div>
          <Link href="/auth/forgot" className="flex-none text-sm text-primary">
            Forget Password?
          </Link>
        </div>

        <button
          type="submit"
          className={\`w-full py-2 \${isPending ? "bg-gray-400" : "bg-primary"} text-white rounded-md text-lg\`}
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center justify-center">
              <Icon icon="lucide:loader" className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 xl:mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          className="p-2 rounded-full border border-gray-300 hover:bg-transparent"
          disabled={isPending}
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          <img src={googleIcon} alt="google" className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full border border-gray-300 hover:bg-transparent"
          disabled={isPending}
          onClick={() => signIn("github", { callbackUrl: "/dashboard", redirect: false })}
        >
          <img src={GithubIcon} alt="github" className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full border border-gray-300 hover:bg-transparent"
        >
          <img src={facebook} alt="facebook" className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="p-2 rounded-full border border-gray-300 hover:bg-transparent"
        >
          <img src={twitter} alt="twitter" className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-5 2xl:mt-8 text-center text-base text-gray-600">
        Don't have an account?{" "}
        <Link href="/auth/register" className="text-primary">
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default LogInForm;
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
  next: {
    "middleware.js": `${nextMiddleware}`,
    "form.js": `${formValidation}`,
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
