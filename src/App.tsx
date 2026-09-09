import { createBrowserRouter, RouterProvider } from "react-router";
import RootLayout from "./routes/root.tsx";
import AppLayout from "./routes/_app.tsx";
import Login from "./routes/login.tsx";
import Signup from "./routes/signup.tsx";
import Dashboard from "./routes/_app.index.tsx";
import Clients from "./routes/_app.clients.tsx";
import ClientDetail, { clientLoader } from "./routes/_app.clients.$id.tsx";
import Activities from "./routes/_app.activities.tsx";
import Calendar from "./routes/_app.calendar.tsx";
import Pipeline from "./routes/_app.pipeline.tsx";
import Projects from "./routes/_app.projects.tsx";
import Users from "./routes/_app.users.tsx";
import Settings from "./routes/_app.settings.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "clients",
            element: <Clients />,
          },
          {
            path: "clients/:id",
            element: <ClientDetail />,
            loader: clientLoader,
          },
          {
            path: "activities",
            element: <Activities />,
          },
          {
            path: "calendar",
            element: <Calendar />,
          },
          {
            path: "pipeline",
            element: <Pipeline />,
          },
          {
            path: "projects",
            element: <Projects />,
          },
          {
            path: "users",
            element: <Users />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
