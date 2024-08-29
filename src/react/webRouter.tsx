import React from "react";
import {createBrowserRouter} from "react-router-dom";
import About from "./marketing/about";
import Documentation from "./marketing/documentation";
import Examples from "./marketing/examples";
import Pricing from "./marketing/pricing";
import VrExperience from "./pages/vrExperience";
import NotFound from "./pages/notFound";

export const webRouter = createBrowserRouter([
    {
        path: "/",
        element: (
            <About/>
        ),
    },
    {
        path: "/documentation",
        element: (<Documentation/>)
    }, {
        path: "/examples",
        element: (<Examples/>)
    }, {
        path: "/Pricing",
        element: (<Pricing/>)
    }, {
        path: "/db/public/:db",
        element: (<VrExperience/>)
    }, {
        path: "/db/private/:db",
        element: (<VrExperience/>)
    }, {
        path: "*",
        element: (<NotFound/>)
    }

])